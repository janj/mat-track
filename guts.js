
const xUniq = _.uniq(_.map(sorted, (s)=> s.X))
const yUniq = _.uniq(_.map(sorted, (s)=> s.Y))

const ROOM_WIDTH = _.max(yUniq);
const ROOM_HEIGHT = _.max(xUniq);

const pairKey = (x, y) => `${x},${y}`;
const pairs = {};
_.each(sorted, (s) => { pairs[pairKey(s.X, s.Y)] = true; })

const stepRunner = (steps) => {
	let current = 0;
	let stepCount = 1000;
	let running = false;

	const run = (rest, lastElement = {}) => {
		lastElement.className = "off";
		if(rest.length === 0) {
			running = false;
			return;
		}
		let nextStep = rest[0];
		let nextElement = document.getElementById(cellId(nextStep.X, nextStep.Y));
		if(!nextElement) {
			console.log(`NO ROOM: ${nextStep}`);
		}
		nextElement.className = "on";
		sleep(120).then(() => { run(rest.slice(1, -1), nextElement)});
	}

	return {
		doNext: () => {
			if (!running) {
				running = true;
				run(steps.slice(current, current + stepCount));
				current += stepCount;
			}
		}
	};
}

const download = (text, name, type) => {
    var a = document.createElement("a");
    var file = new Blob([text], {type: type});
    a.href = URL.createObjectURL(file);
    a.download = name;
    a.click();
}

const buildButton = (text, fnct) => {
	var btn = document.createElement('button');
	btn.id = text;
	btn.className = 'btn btn-default';
	btn.appendChild(document.createTextNode(text));
	btn.onclick = fnct;
	return btn;
}

const buildHeader = (runner) => {
	let = header = document.createElement("div");
	header.appendChild(buildButton("Next Steps", runner.doNext));
	return header;
}

const cellId = (x, y) => "c."+x+"."+y;

let buildDisplay = (elementId) => {
	const runner = stepRunner(sorted);
	styleInit();
	let rootNode = document.getElementById(elementId);
	rootNode.innerHTML = "";
	rootNode.appendChild(buildHeader(runner));
	rootNode.appendChild(matTableElement());
}

const matTableElement = () => {
	let matTable = document.createElement("table");
	for(let i=0; i<=ROOM_HEIGHT; i++) {
		let rowNode = document.createElement("tr");
		for(let j=0; j<=ROOM_WIDTH; j++) {
			let cell = document.createElement("td");
			cell.id = cellId(i, j);
			cell.className = pairs[pairKey(i, j)] ? "off" : "never";
			rowNode.appendChild(cell);
		}
		matTable.appendChild(rowNode);
	}
	return matTable;
}

let styleInit = () => {
    var style_rules = [];
    style_rules.push("td { width: 12px; height: 12px; }");
	style_rules.push("td.off { background-color: lightgray; }")
	style_rules.push("td.never { background-color: gray; }")
	style_rules.push("td.on { background-color: magenta; }")
    style_rules.push("table { border-collapse:collapse; margin: 20px auto 20px auto; }");
    var style = document.createElement("style");
    style.type = "text/css";
    style.innerHTML = style_rules.join("\n");
    document.head.appendChild(style);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}