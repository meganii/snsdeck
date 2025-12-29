// Add type definition for window.snsdeck
declare global {
  interface Window {
    snsdeck: {
      openAddColumn: () => void;
      openRemoveColumn: (index: number) => void;
      onScroll: (callback: (event: any, deltaX: number) => void) => void;
      onLoadColumns: (callback: (event: any, numOfColumn: number) => void) => void;
      onAddColumn: (callback: (event: any) => void) => void;
      addColumn: (column: any) => void;
    };
  }
}

import './index.css';

const columnWidth = 400;
const marginLeft = 150;

function removeColumn(e: Event) {
    const target = e.currentTarget as HTMLElement;
    const elemOfColumn = target.parentNode as HTMLElement;
    console.log(elemOfColumn);
    console.log('removeColumn');
    const indexOfColumn = getIndexOfColumn(elemOfColumn);
    console.log(indexOfColumn);
    window.snsdeck.openRemoveColumn(indexOfColumn);
    elemOfColumn.remove();

    // Redraw column
    const columns = document.querySelectorAll(".column") as NodeListOf<HTMLElement>;
    for (let i = indexOfColumn; i < columns.length; i++) {
        const div = columns[i];
        const left = parseInt(div.style.left.slice(0, -2)) - columnWidth;
        console.log(left);
        div.style.left = `${left}px`;
    }
}

function getIndexOfColumn(node: HTMLElement): number {
    const columns = document.querySelectorAll('.column');
    for (let i = 0; i < columns.length; i++) {
        if (node === columns[i]) {
            return i;
        }
    }
    return -1;
}

window.snsdeck.onScroll((_event, deltaX) => {
    const columns = document.querySelectorAll(".column") as NodeListOf<HTMLElement>;
    for (const column of columns) {
        const newLeft = parseInt(column.style.left.slice(0, -2)) - deltaX;
        column.style.left = `${newLeft}px`;
    }
    console.log('from BrowserView', deltaX);
});

window.snsdeck.onLoadColumns((_event, numOfColumn) => {
    console.log('onLoadColumns', numOfColumn);
    const controller = document.getElementById('controller');
    if (!controller) return;

    for (let i = 0; i < numOfColumn; i++) {
        const div = document.createElement('div');
        div.className = 'column';
        div.style.top = '0px';
        div.style.left = `${columnWidth * i + marginLeft}px`;
        const btn = document.createElement('button');
        btn.className = "close";
        btn.innerText = 'X';
        div.appendChild(btn);
        controller.appendChild(div);
    }

    const buttons = document.querySelectorAll(".close");
    for (const btn of buttons) {
        btn.addEventListener('click', removeColumn);
    }
});

window.snsdeck.onAddColumn((_event) => {
    const columns = document.querySelectorAll(".column") as NodeListOf<HTMLElement>;
    const lastColumn = columns[columns.length - 1];
    const controller = document.getElementById('controller');
    if (!controller) return;

    const div = document.createElement('div');
    div.className = 'column';
    let left = 0;
    if (columns.length > 0) {
        left = parseInt(lastColumn.style.left.slice(0, -2)) + columnWidth;
    } else {
        left = marginLeft;
    }
    div.style.top = '0px';
    div.style.left = `${left}px`;
    const btn = document.createElement('button');
    btn.className = "close";
    btn.innerText = 'X';
    btn.addEventListener('click', removeColumn);
    div.appendChild(btn);
    controller.appendChild(div);
});
