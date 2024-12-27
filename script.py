import os

def scrape_file_paths(directory):
    """
    Recursively collects all file paths in the specified directory.

    Args:
        directory (str): The root directory to scrape files from.

    Returns:
        list: A list of full file paths.
    """
    file_paths = []

    # Walk through directory and subdirectories
    for root, _, files in os.walk(directory):
        for file in files:
            # Construct full file path
            full_path = os.path.join(root, file)
            file_paths.append(full_path)

    return file_paths

def main():
    directory = "/Users/proximo/Documents/GitHub/ProximoLife/src"
    
    # Check if the directory exists
    if not os.path.exists(directory):
        print(f"The directory {directory} does not exist.")
        return

    # Get all file paths
    file_paths = scrape_file_paths(directory)

    # Print the file paths
    print("\nList of files:")
    for path in file_paths:
        print(path)

    # Optionally, write them to a text file
    with open("file_paths.txt", "w") as f:
        for path in file_paths:
            f.write(path + "\n")

if __name__ == "__main__":
    main()
