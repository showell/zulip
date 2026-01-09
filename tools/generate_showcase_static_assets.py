import subprocess

subprocess.run(
    ["./tools/webpack", "--config-name=frontend"],
    check=True,
)

# fake a favico icon
subprocess.run(
    ["touch", "static/webpack-bundles/favicon.ico"],
    check=True,
)
print("made fake icon too");

