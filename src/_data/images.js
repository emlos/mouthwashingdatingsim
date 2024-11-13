
const config = require( "./config");

const prefix = config.githubPrefix



const fs = require('fs');
const path = require('path');

const root = path.normalize(__dirname + '/../..')

// Function to check if the file is an image based on its extension
function isImageFile(fileName) {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.webp'];
    const ext = path.extname(fileName).toLowerCase();
    return imageExtensions.includes(ext);
}


// Recursive function to get all image paths
function getAllImagePaths(dir, relativeDir) {
    let results = [];
    const list = fs.readdirSync(dir);

    list.forEach((file) => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat && stat.isDirectory()) {
            // Recurse into subdirectory
            results = results.concat(getAllImagePaths(filePath, path.join(relativeDir, file)));
        } else if (isImageFile(file)) {
            // Add the relative file path to the results array
            results.push(path.join('/',prefix, relativeDir, file));
        }
    });

    return results;
}

// Usage: Replace './src/images' with the path to your images directory
const imageDirectory = path.join(root, './src/images');
const imagesArray = getAllImagePaths(imageDirectory, 'images');

module.exports = imagesArray