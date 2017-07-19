
const xUniq = _.uniq(_.map(sorted, (s)=> s.X))
const yUniq = _.uniq(_.map(sorted, (s)=> s.Y))

const ROOM_WIDTH = _.max(xUniq);
const ROOM_HEIGHT = _.max(yUniq);

const pairKey = (x, y) => `${x},${y}`;
const pairs = {};
_.each(sorted, (s) => { pairs[pairKey(s.X, s.Y)] = true; })

const cellForStep = (step) => {
	return document.getElementById(cellId(step.X, step.Y));
}

const stepRunner = (steps) => {
	let currentStepIndex = -1;
	let running = false;
	let pause = 75;

	const setClassForStepAtIndex = (stepIndex, elementClass) => {
		const step = steps[stepIndex];
		cellForStep(step).className = elementClass;
	}
	
	const atEnd = () => currentStepIndex >= steps.length;

	const updateDisplay = () => {
		const step = steps[currentStepIndex];
		updateTextElement("stepIndex", `Step: ${currentStepIndex}`)
		updateTextElement("timestamp", `At: ${step.Timestamp}`);
		updateTextElement("coord", `X: ${step.X}, Y: ${step.Y}, Z: ${step.Z}`);
	}

	const step = () => {
		if (atEnd()) return;
		if (currentStepIndex >= 0) {
			setClassForStepAtIndex(currentStepIndex, "off");
		}
		currentStepIndex++;
		setClassForStepAtIndex(currentStepIndex, "on");
		updateDisplay();
	}

	const back = () => {
		if (currentStepIndex <= 0) return;
		setClassForStepAtIndex(currentStepIndex, "off");
		currentStepIndex--;
		setClassForStepAtIndex(currentStepIndex, "on");
		updateDisplay();
	}
	
	const slower = () => pause += 25;
	const faster = () => pause = _.max(0, pause - 25);
	
	const runLoop = () => {
		if (atEnd() || !running) return;
		step();
		sleep(pause).then(runLoop);
	}

	return {
		step, back, faster, slower,
		pause: () => { running = false; },
		doNext: () => {
			if (!running) {
				running = true;
				runLoop();
			}
		}
	};
}

const updateTextElement = (elementId, text) => {
	const element = document.getElementById(elementId);
	element.innerHTML = text;
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
	header.appendChild(buildButton("Pause", runner.pause));
	header.appendChild(buildButton("Step", runner.step));
	header.appendChild(buildButton("Back", runner.back));
	header.appendChild(buildButton("Faster", runner.faster));
	header.appendChild(buildButton("Slower", runner.slower));
	return header;
}

const buildFooter = () => {
	const footer = document.createElement("div");
	footer.id = "footer";
	
	_.each(["stepIndex", "timestamp", "coord"], (spanId) => {
		const spanElement = document.createElement("span");
		spanElement.id = spanId;
		footer.appendChild(spanElement);
	});

	return footer;
}

const cellId = (x, y) => "c."+x+"."+y;

let buildDisplay = (elementId) => {
	const runner = stepRunner(sorted);
	styleInit();
	let rootNode = document.getElementById(elementId);
	rootNode.innerHTML = "";
	rootNode.appendChild(buildHeader(runner));
	rootNode.appendChild(matTableElement());
	rootNode.appendChild(buildFooter());
}

const matTableElement = () => {
	let matTable = document.createElement("table");
	for(let y=ROOM_HEIGHT-1; y>=0; y--) {
		let rowNode = document.createElement("tr");
		for(let x=0; x<=ROOM_WIDTH; x++) {
			let cell = document.createElement("td");
			cell.id = cellId(x, y);
			cell.className = pairs[pairKey(x, y)] ? "off" : "never";
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
	style_rules.push("#footer span { padding: 5px; }")
    var style = document.createElement("style");
    style.type = "text/css";
    style.innerHTML = style_rules.join("\n");
    document.head.appendChild(style);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}