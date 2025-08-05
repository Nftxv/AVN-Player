import os

def is_hidden(path):
    return any(part.startswith('.') for part in path.split(os.sep))

def main():
    base_dir = os.getcwd()
    output_lines = []

    for root, dirs, files in os.walk(base_dir):
        # delite h
        dirs[:] = [d for d in dirs if not is_hidden(d)]

        for file in files:
            if is_hidden(file):
                continue

            full_path = os.path.join(root, file)
            rel_path = os.path.relpath(full_path, base_dir)
            rel_path_posix = rel_path.replace('\\', '/')

            try:
                with open(full_path, 'r', encoding='utf-8') as f:
                    content = f.read()
            except Exception as e:
                print(f"skip (not read): {rel_path_posix}")
                continue

            output_lines.append(f"## ./{rel_path_posix}")
            output_lines.append("")
            output_lines.append(content.rstrip('\n'))
            output_lines.append("")
            output_lines.append("")

    with open("project_dump.md", "w", encoding="utf-8") as out:
        out.write("\n".join(output_lines))

    print("project_dump.md <- done.")

if __name__ == "__main__":
    main()
