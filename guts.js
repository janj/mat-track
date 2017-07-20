const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

(function styleInit() {
    var style_rules = [];
    style_rules.push("td { width: 12px; height: 12px; }");
	style_rules.push("td.off { background-color: lightgray; }")
	style_rules.push("td.never { background-color: gray; }")
	style_rules.push("td.on { background-color: magenta; }")
    style_rules.push("table { border-collapse:collapse; margin: 20px auto 20px auto; }");
	style_rules.push(".footer span { padding: 5px; }")
    const style = document.createElement("style");
    style.type = "text/css";
    style.innerHTML = style_rules.join("\n");
    document.head.appendChild(style);
})();

const buildDisplay = (displays) => {
	_.each(displays, (display) => {
		const stepData = stepDataFactory(display.steps);
		const runner = stepRunner(stepData);
		const displayController = displayFactory(display.id, runner, stepData);
		runner.setDisplay(displayController);
	});
}

const stepDataFactory = (steps) => {
	const xUniq = _.uniq(_.map(steps, (s)=> s.X))
	const yUniq = _.uniq(_.map(steps, (s)=> s.Y))

	const ROOM_WIDTH = _.max(xUniq);
	const ROOM_HEIGHT = _.max(yUniq);

	const pairKey = (x, y) => `${x},${y}`;
	const pairs = {};
	_.each(steps, (s) => { pairs[pairKey(s.X, s.Y)] = true; })

	return {
		stepAtIndex: (index) => steps[index],
		numberOfSteps: steps.length,
		width: ROOM_WIDTH,
		height: ROOM_HEIGHT,
		isSteppedOn: (x, y) => pairs[pairKey(x,y)]
	}
}

const stepRunner = (stepData) => {
	let currentStepIndex = -1;
	let running = false;
	let pause = 75;
	let displayController = null;
	
	const currentStep = () => stepData.stepAtIndex(currentStepIndex);
	const atEnd = () => currentStepIndex >= stepData.numberOfSteps;
	const updateDisplay = () => displayController.updateDisplay(currentStep(), currentStepIndex);

	const setClassForStepAtIndex = (stepIndex, elementClass) => {
		const step = stepData.stepAtIndex(stepIndex);
		cellForStep(step).className = elementClass;
	}
	
	const updateCurrentStep = (isOn) => {
		displayController.updateCell(currentStep(), isOn);
	}

	const step = () => {
		if (atEnd()) return;
		if (currentStepIndex >= 0) {
			updateCurrentStep(false);
		}
		currentStepIndex++;
		updateCurrentStep(true);
		updateDisplay();
	}

	const back = () => {
		if (currentStepIndex <= 0) return;
		updateCurrentStep(false);
		currentStepIndex--;
		updateCurrentStep(true);
		updateDisplay();
	}
	
	const slower = () => { pause += 25 };
	const faster = () => { pause = Math.max(0, pause - 25) };
	
	const runLoop = (restart) => {
		if (restart) {
			if (running) return;
			running = true;
		}
		if (atEnd() || !running) return;
		step();
		sleep(pause).then(runLoop);
	}

	return {
		step, back, faster, slower,
		pause: () => { running = false; },
		doNext: () => { runLoop(true); },
		setDisplay: (display) => displayController = display
	};
}

const displayFactory = (key, runner, stepData) => {
	const idx = (elementId) => `${key}_${elementId}`;
	
	const updateTextElement = (elementId, text) => {
		const element = document.getElementById(idx(elementId));
		element.innerHTML = text;
	}
	
	const buildButton = (text, fnct) => {
		var btn = document.createElement('button');
		btn.className = 'btn btn-default';
		btn.appendChild(document.createTextNode(text));
		btn.onclick = fnct;
		return btn;
	}

	const buildFooter = () => {
		const footer = document.createElement("div");
		footer.className = "footer";
		_.each(["stepIndex", "timestamp", "coord"], (spanId) => {
			const spanElement = document.createElement("span");
			spanElement.id = idx(spanId);
			footer.appendChild(spanElement);
		});
		return footer;
	}
	
	const cellId = (x, y) => idx(`c.${x}.${y}`);
	
	const matTableElement = (stepData) => {
		let matTable = document.createElement("table");
		for(let y=stepData.height; y>=0; y--) {
			let rowNode = document.createElement("tr");
			for(let x=0; x<=stepData.width; x++) {
				let cell = document.createElement("td");
				cell.id = cellId(x, y);
				cell.className = stepData.isSteppedOn(x, y) ? "off" : "never";
				rowNode.appendChild(cell);
			}
			matTable.appendChild(rowNode);
		}
		return matTable;
	}
	
	const updateDisplay = (step, currentStepIndex) => {
		updateTextElement("stepIndex", `Step: ${currentStepIndex}`);
		updateTextElement("timestamp", `At: ${step.Timestamp}`);
		updateTextElement("coord", `X: ${step.X}, Y: ${step.Y}, Z: ${step.Z}`);
	}
	
	const updateCell = (step, isOn) => {
		const cell = document.getElementById(cellId(step.X, step.Y));
		cell.className = isOn ? "on" : "off";
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
	};
	
	let rootNode = document.getElementById(key);
	rootNode.innerHTML = "";
	rootNode.appendChild(buildHeader(runner));
	rootNode.appendChild(matTableElement(stepData));
	rootNode.appendChild(buildFooter());
	
	return {
		updateDisplay, updateCell
	};
}

const download = (text, name, type) => {
    var a = document.createElement("a");
    var file = new Blob([text], {type: type});
    a.href = URL.createObjectURL(file);
    a.download = name;
    a.click();
}
