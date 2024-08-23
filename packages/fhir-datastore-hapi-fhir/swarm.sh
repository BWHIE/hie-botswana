declare ACTION=""
declare MODE=""
declare COMPOSE_FILE_PATH=""
declare UTILS_PATH=""
declare STACK="hapi-fhir"

function init_vars() {
  ACTION=$1
  MODE=$2

  COMPOSE_FILE_PATH=$(
    cd "$(dirname "${BASH_SOURCE[0]}")" || exit
    pwd -P
  )

  UTILS_PATH="${COMPOSE_FILE_PATH}/../utils"

  readonly ACTION
  readonly MODE
  readonly COMPOSE_FILE_PATH
  readonly UTILS_PATH
  readonly STACK
}

# shellcheck disable=SC1091
function import_sources() {
  source "${UTILS_PATH}/docker-utils.sh"
  source "${UTILS_PATH}/config-utils.sh"
  source "${UTILS_PATH}/log.sh"
}

## Rewrite the deploy_config_importer and remove_config_importer functions to increase timeout in order to enable Hapi fhir to correctly
## persist Master Facility List location & organization resources

docker::deploy_config_importer_variant() {
    local -r STACK_NAME="${1:?$(missing_param "deploy_config_importer" "STACK_NAME")}"
    local -r CONFIG_COMPOSE_PATH="${2:?$(missing_param "deploy_config_importer" "CONFIG_COMPOSE_PATH")}"
    local -r SERVICE_NAME="${3:?$(missing_param "deploy_config_importer" "SERVICE_NAME")}"
    local -r CONFIG_LABEL="${4:?$(missing_param "deploy_config_importer" "CONFIG_LABEL")}"

    log info "Waiting for config importer $SERVICE_NAME to start ..."
    (
        if [[ ! -f "$CONFIG_COMPOSE_PATH" ]]; then
            log error "No such file: $CONFIG_COMPOSE_PATH"
            exit 1
        fi

        config::set_config_digests "$CONFIG_COMPOSE_PATH"

        try \
            "docker stack deploy -d -c ${CONFIG_COMPOSE_PATH} ${STACK_NAME}" \
            throw \
            "Wrong configuration in $CONFIG_COMPOSE_PATH"

        log info "Waiting to give core config importer time to run before cleaning up service"

        config::remove_config_importer_variant "$STACK_NAME" "$SERVICE_NAME"
        config::await_service_removed "$STACK_NAME" "$SERVICE_NAME"

        log info "Removing stale configs..."
        config::remove_stale_service_configs "$CONFIG_COMPOSE_PATH" "$CONFIG_LABEL"
        overwrite "Removing stale configs... Done"
    ) || {
        log error "Failed to deploy the config importer: $SERVICE_NAME"
        exit 1
    }
}

config::remove_config_importer_variant() {
    local -r STACK_NAME="${1:?$(missing_param "remove_config_importer" "STACK_NAME")}"
    local -r CONFIG_IMPORTER_SERVICE_NAME="${2:?$(missing_param "remove_config_importer" "CONFIG_IMPORTER_SERVICE_NAME")}"
    local -r exit_time="${3:-5000}"
    local -r warning_time="${4:-}"
    local -r start_time=$(date +%s)

    local config_importer_state

    if [[ -z $(docker service ps "$STACK_NAME"_"$CONFIG_IMPORTER_SERVICE_NAME") ]]; then
        log info "${STACK_NAME}_$CONFIG_IMPORTER_SERVICE_NAME service cannot be removed as it does not exist!"
        exit 0
    fi

    config_importer_state=$(docker service ps "$STACK_NAME"_"$CONFIG_IMPORTER_SERVICE_NAME" --format "{{.CurrentState}}")
    until [[ $config_importer_state == *"Complete"* ]]; do
        config::timeout_check "$start_time" "$CONFIG_IMPORTER_SERVICE_NAME to run" "$exit_time" "$warning_time"
        sleep 1

        config_importer_state=$(docker service ps "$STACK_NAME"_"$CONFIG_IMPORTER_SERVICE_NAME" --format "{{.CurrentState}}")
        if [[ $config_importer_state == *"Failed"* ]] || [[ $config_importer_state == *"Rejected"* ]]; then
            log error "Fatal: $CONFIG_IMPORTER_SERVICE_NAME failed with error:
       $(docker service ps ${STACK_NAME}_"$CONFIG_IMPORTER_SERVICE_NAME" --no-trunc --format '{{.Error}}')"
            exit 1
        fi
    done

    try "docker service rm "$STACK_NAME"_$CONFIG_IMPORTER_SERVICE_NAME" catch "Failed to remove config importer"
}

function initialize_package() {
  local hapi_fhir_dev_compose_filename=""

  if [ "${MODE}" == "dev" ]; then
    log info "Running package in DEV mode"
    hapi_fhir_dev_compose_filename="docker-compose.dev.yml"
  else
    log info "Running package in PROD mode"
  fi

  if [ "${CLUSTERED_MODE}" == "true" ]; then
    postgres_cluster_compose_filename="docker-compose-postgres.cluster.yml"
  fi

  (

    docker::await_service_status "postgres" "postgres-1" "Running"

    if [[ "${ACTION}" == "init" ]]; then
      docker::deploy_config_importer "postgres" "$COMPOSE_FILE_PATH/importer/docker-compose.config.yml" "hapi_db_config" "hapi-fhir"
    fi

    docker::deploy_service "$STACK" "${COMPOSE_FILE_PATH}" "docker-compose.yml" "$hapi_fhir_dev_compose_filename"

    # if [[ "${ACTION}" == "init" ]]; then

    #   docker::await_service_status "$STACK" "hapi-fhir" "Running"

    #   docker::deploy_config_importer_variant "$STACK" "$COMPOSE_FILE_PATH/importer/docker-compose.seeder.yml" "hapi_seeder_config" "hapi-fhir"
    #   log info "Hapi Fhir seeded successfully"
    # fi

  ) ||
    {
      log error "Failed to deploy package"
      exit 1
    }
}

function destroy_package() {
  docker::stack_destroy "$STACK"

  if [[ "${CLUSTERED_MODE}" == "true" ]]; then
    log warn "Volumes are only deleted on the host on which the command is run. Postgres volumes on other nodes are not deleted"
  fi

  docker::prune_configs "hapi-fhir"
}

main() {
  init_vars "$@"
  import_sources

  if [[ "${ACTION}" == "init" ]] || [[ "${ACTION}" == "up" ]]; then
    if [[ "${CLUSTERED_MODE}" == "true" ]]; then
      log info "Running package in Cluster node mode"
    else
      log info "Running package in Single node mode"
    fi

    initialize_package
  elif [[ "${ACTION}" == "down" ]]; then
    log info "Scaling down package"

    docker::scale_services "$STACK" 0
  elif [[ "${ACTION}" == "destroy" ]]; then
    log info "Destroying package"
    destroy_package
  else
    log error "Valid options are: init, up, down, or destroy"
  fi
}

main "$@"