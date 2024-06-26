import * as Papa from 'papaparse';
import * as path from 'path';
import * as fs from 'fs';

// Define a function to read and parse the CSV file
export function readCsv(filePath: string): any {
    const outputs: any[] = []

    const absolutePath = path.resolve(filePath);
    
    // Check if the file exists
    if (!fs.existsSync(absolutePath)) {
        console.error(`File not found: ${absolutePath}`);
        return [];
    }

    // Read the file content
    const fileContent = fs.readFileSync(absolutePath, 'utf8');
    
    // Parse the CSV content using PapaParse
    Papa.parse(fileContent, {
        header: true,  // Specify if the CSV has a header row
        skipEmptyLines: true,
        complete: (results) => {
            outputs.push(results.data)
            // console.log(results.data);  // Handle the parsed data
        },
        error: (error: { message: any; }) => {
            console.error(error.message);  // Handle any errors
        }
    });

    return outputs

}


export function saveData(filePath: string, data: any) {
    fs.writeFile(filePath, JSON.stringify(data), (err) => {
        if (err) {
            console.error(`Error writing JSON file ${filePath}:`, err);
        } else {
            console.log(`JSON file has been saved to ${filePath}`);
        }
    });
}
