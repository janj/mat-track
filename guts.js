const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

(function styleInit() {
    var style_rules = [];
    style_rules.push("td { width: 12px; height: 12px; }");
	style_rules.push("td.off { background-color: lightgray; }")
	style_rules.push("td.never { background-color: gray; }")
	style_rules.push("td.on { background-color: magenta; }")
	style_rules.push("td.lightEdge { background-color: lightblue; }")
	style_rules.push("td.medEdge { background-color: blue; }")
	style_rules.push("td.heavyEdge { background-color: darkblue; }")
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
		const runner = timeRunner(stepData);
		// const runner = stepRunner(stepData);
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

const stepAnalyzer = (stepData) => {
	let foundEdgeSteps = null;
	
	const stepMap = (step) => `${step.X}.${step.Y}`;
	
	const edgeStepDict = () => {
		if (!foundEdgeSteps) {
			const atEdge = (step) => step.X == 0 || step.Y == 0 || step.X == stepData.width || step.Y == stepData.height;
			foundEdgeSteps = {};
			for (let i=0; i<stepData.numberOfSteps; i++) {
				const step = stepData.stepAtIndex(i);
				if (atEdge(step)) {
					foundEdgeSteps[stepMap(step)] = foundEdgeSteps[stepMap(step)] || 0;
					foundEdgeSteps[stepMap(step)]++;
				}
			}
			console.log(Object.keys(foundEdgeSteps).length)
		}
		return foundEdgeSteps;
	}
	
	return {
		isEdgeStep: step => !!edgeStepDict()[stepMap(step)],
		edgeSteps: edgeStepDict(),
		edgeStepCount: step => edgeStepDict()[stepMap(step)]
	}
}

const timeRunner = (stepData) => {
	let currentTime = stepData.stepAtIndex(0).Timestamp;
	let running = false;
	let displayController = null;
	let pause = 100;
	
	let currentLingerIndex = 0;
	let currentStepIndex = 0;
	
	const analyzer = stepAnalyzer(stepData);
	const stepLingerTime = 1000;

	const atEnd = () => currentLingerIndex >= stepData.numberOfSteps;

	const cellClassForStep = (step, isOn) => {
		if (isOn) {
			return "on";
		} else if (!stepData.isSteppedOn(step.X, step.Y)) {
			return "never";
		} else if (analyzer.isEdgeStep(step)) {
			const stepCount = analyzer.edgeStepCount(step);
			if (stepCount > 250) {
				return "heavyedge";
			} else if (stepCount > 100) {
				return "mededge";
			} else if (stepCount > 10) {
				return "lightedge";
			}
		}
		return "off";
	}
	
	const updateCurrentStepsDisplay = () => {
		let lingerStep = stepData.stepAtIndex(currentLingerIndex);
		while(lingerStep.Timestamp + stepLingerTime < currentTime) {
			displayController.updateCellClass(lingerStep, cellClassForStep(lingerStep, false));
			currentLingerIndex++;
			lingerStep = stepData.stepAtIndex(currentLingerIndex);
		}
		
		let currentStep = stepData.stepAtIndex(currentStepIndex);
		while(currentStep.Timestamp < currentTime && currentStepIndex < stepData.numberOfSteps) {
			currentStepIndex++;
			currentStep = stepData.stepAtIndex(currentStepIndex);
		}
		
		for(let onIndex = currentLingerIndex; onIndex < currentStepIndex; onIndex++) {
			const step = stepData.stepAtIndex(onIndex);
			displayController.updateCellClass(step, cellClassForStep(step, true));
		}
	}

	const updateDisplay = () => displayController.updateDisplay({ Timestamp: currentTime });

	const timeToNextStep = () => stepData.stepAtIndex(currentStepIndex).Timestamp - currentTime;

	const step = () => {
		if (atEnd()) return;
		
		if (timeToNextStep() > 10000) {
			currentTime += timeToNextStep() / 10;
		} else {
			currentTime += 100;
		}
		updateCurrentStepsDisplay();
		updateDisplay();
	}
	
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
		step,
		faster: () => { if (pause > 0) pause -= 10; },
		slower: () => { pause += 10; },
		pause: () => { running = false; },
		doNext: () => { runLoop(true); },
		setDisplay: (display) => displayController = display
	};
}

const stepRunner = (stepData) => {
	let currentStepIndex = -1;
	let running = false;
	let pause = 75;
	let displayController = null;
	
	const currentStep = () => stepData.stepAtIndex(currentStepIndex);
	const atEnd = () => currentStepIndex >= stepData.numberOfSteps;
	const updateDisplay = () => displayController.updateDisplay(_.merge(currentStep(), { currentStepIndex }));

	const updateCurrentStep = (isOn) => {
		const cellClass = isOn ? "on" : "off";
		displayController.updateCellClass(currentStep(), cellClass);
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
	
	const updateDisplay = (stepData) => {
		const stepIndex = !!stepData.currentStepIndex ? `Step: ${stepData.currentStepIndex}` : "";
		const dateString = !!stepData.Timestamp ? dateStringForMillis(stepData.Timestamp) : "";
		const coord = !!stepData.X ? `X: ${stepData.X}, Y: ${stepData.Y}, Z: ${stepData.Z}` : "";
		updateTextElement("stepIndex", stepIndex);
		updateTextElement("timestamp", dateString);
		updateTextElement("coord", coord);
	}

	const updateCellClass = (step, cellClass) => {
		document.getElementById(cellId(step.X, step.Y)).className = cellClass;
	}
	
	const appendChildButton = (parentElement, label, func) => {
		if (!!func)	parentElement.appendChild(buildButton(label, func));
	}

	const buildHeader = (runner) => {
		let = header = document.createElement("div");
		appendChildButton(header, "Next Steps", runner.doNext);
		appendChildButton(header, "Pause", runner.pause);
		appendChildButton(header, "Step", runner.step);
		appendChildButton(header, "Back", runner.back);
		appendChildButton(header, "Faster", runner.faster);
		appendChildButton(header, "Slower", runner.slower);
		return header;
	};
	
	let rootNode = document.getElementById(key);
	rootNode.innerHTML = "";
	rootNode.appendChild(buildHeader(runner));
	rootNode.appendChild(matTableElement(stepData));
	rootNode.appendChild(buildFooter());
	
	return {
		updateDisplay, updateCellClass
	};
}

const dateStringForMillis = (millis) => {
	const d = new Date(0);
	d.setUTCMilliseconds(millis);
	return d.toISOString();
}

const download = (text, name, type) => {
    var a = document.createElement("a");
    var file = new Blob([text], {type: type});
    a.href = URL.createObjectURL(file);
    a.download = name;
    a.click();
}
