export class Section {
    outer_div: HTMLElement;

    constructor() {
        const outer_div = document.createElement("div");
        outer_div.style.display = "flex";
        outer_div.style.justifyContent = "centerl";
        outer_div.style.backgroundColor = "white";

        const demo_area = document.querySelector(".demo");
        demo_area!.append(outer_div);
        this.outer_div = outer_div;
    }

    new_container(info: {title: string; width: string}): HTMLElement {
        const {title, width} = info;

        const div = document.createElement("div");
        div.style.width = width;
        div.style.border = "1px solid blue";
        div.style.margin = "10px";
        div.style.padding = "20px";

        const heading = document.createElement("b");
        heading.textContent = title;

        const container = document.createElement("div");

        div.append(heading);
        div.append(container);

        this.outer_div.append(div);

        return container;
    }
}
