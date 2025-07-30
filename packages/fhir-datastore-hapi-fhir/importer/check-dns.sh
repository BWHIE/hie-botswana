#!/bin/bash

echo "=== DNS Configuration Check ==="
echo ""

echo "1. Current DNS servers from /etc/resolv.conf:"
cat /etc/resolv.conf
echo ""

echo "2. Testing common DNS servers:"
dns_servers=(
    "8.8.8.8"      # Google DNS
    "8.8.4.4"      # Google DNS Secondary
    "1.1.1.1"      # Cloudflare DNS
    "1.0.0.1"      # Cloudflare DNS Secondary
    "208.67.222.222" # OpenDNS
    "208.67.220.220" # OpenDNS Secondary
    "9.9.9.9"      # Quad9 DNS
    "149.112.112.112" # Quad9 DNS Secondary
)

for dns in "${dns_servers[@]}"; do
    echo "Testing $dns..."
    if nslookup registry.npmjs.org $dns >/dev/null 2>&1; then
        echo "  ✅ $dns - WORKING"
    else
        echo "  ❌ $dns - FAILED"
    fi
done

echo ""
echo "3. Testing direct connectivity to npm registry:"
if curl -s --connect-timeout 10 https://registry.npmjs.org/ >/dev/null; then
    echo "  ✅ Direct HTTPS connection to npm registry - WORKING"
else
    echo "  ❌ Direct HTTPS connection to npm registry - FAILED"
fi

echo ""
echo "4. Testing with different DNS servers:"
for dns in "${dns_servers[@]}"; do
    echo "Testing npm registry with DNS $dns..."
    if timeout 10 nslookup registry.npmjs.org $dns >/dev/null 2>&1; then
        echo "  ✅ Can resolve registry.npmjs.org with $dns"
    else
        echo "  ❌ Cannot resolve registry.npmjs.org with $dns"
    fi
done

echo ""
echo "5. Network interface information:"
ip addr show

echo ""
echo "6. Current routing table:"
ip route show 