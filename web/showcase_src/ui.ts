export class Section {
    new_container(info: {title: string; width: string}): HTMLElement {
        const {title, width} = info;

        const demo_area = document.querySelector(".demo");
        const outer_div = document.createElement("div");
        outer_div.style.display = "grid";
        outer_div.style.placeItems = "center";
        outer_div.style.backgroundColor = "white";
        const div = document.createElement("div");
        div.style.width = width;
        div.style.border = "1px solid blue";
        div.style.margin = "5px";
        div.style.padding = "10px";
        const heading = document.createElement("h5");
        heading.textContent = title;
        outer_div.append(heading);
        outer_div.append(div);
        demo_area!.append(outer_div);
        return div;
    }
}
