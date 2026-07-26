(() => {
  const data = window.OLLIECATOR_DATA;
  const values = [2, 1, 0, -1, -2];
  const labels = ["Definitely A", "Slightly A", "Both equally", "Slightly B", "Definitely B"];

  const state = {
    current: 0,
    answers: new Array(data.questions.length).fill(null),
    questionOrder: [],
    scores: { chat: 0, study: 0, plan: 0 },
    pendingTies: [],
    resultCode: "",
  };

  const views = {
    landing: document.querySelector("#landing-view"),
    quiz: document.querySelector("#quiz-view"),
    tie: document.querySelector("#tie-view"),
    calculating: document.querySelector("#calculating-view"),
    result: document.querySelector("#result-view"),
  };

  const $ = (selector) => document.querySelector(selector);

  function shuffle(items) {
    const shuffled = [...items];
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
    }
    return shuffled;
  }

  function createQuestionOrder() {
    const dimensions = shuffle(["chat", "study", "plan"]);
    const buckets = Object.fromEntries(
      dimensions.map((dimension) => [
        dimension,
        shuffle(data.questions.filter((question) => question.dimension === dimension)),
      ])
    );
    const rounds = Math.max(...dimensions.map((dimension) => buckets[dimension].length));
    const orderedQuestions = [];

    for (let round = 0; round < rounds; round += 1) {
      dimensions.forEach((dimension) => {
        if (buckets[dimension][round]) {
          orderedQuestions.push(buckets[dimension][round]);
        }
      });
    }

    return orderedQuestions;
  }

  function showView(name) {
    Object.entries(views).forEach(([key, view]) => {
      view.hidden = key !== name;
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => $("#app").focus({ preventScroll: true }), 50);
  }

  function startQuiz() {
    state.current = 0;
    state.questionOrder = createQuestionOrder();
    state.answers = new Array(state.questionOrder.length).fill(null);
    state.scores = { chat: 0, study: 0, plan: 0 };
    state.pendingTies = [];
    state.resultCode = "";
    renderQuestion();
    showView("quiz");
  }

  function renderQuestion() {
    const question = state.questionOrder[state.current];
    const number = state.current + 1;
    const percent = Math.round((number / state.questionOrder.length) * 100);

    $("#question-count").textContent = `Question ${number} of ${state.questionOrder.length}`;
    $("#progress-percent").textContent = `${percent}%`;
    $("#progress-fill").style.width = `${percent}%`;
    $(".progress-track").setAttribute("aria-valuenow", String(number));
    $("#question-number").textContent = String(number).padStart(2, "0");
    $("#question-title").textContent = question.title;
    $("#question-context").textContent = question.context;
    $("#answer-a").textContent = question.a;
    $("#answer-b").textContent = question.b;

    const scale = $("#answer-scale");
    scale.innerHTML = "";
    values.forEach((value, index) => {
      const wrapper = document.createElement("label");
      wrapper.className = "scale-option";
      const input = document.createElement("input");
      input.type = "radio";
      input.name = `question-${state.current}`;
      input.value = String(value);
      input.checked = state.answers[state.current] === value;
      input.setAttribute("aria-label", labels[index]);
      input.addEventListener("change", () => {
        state.answers[state.current] = value;
        updateNextButton();
      });
      const dot = document.createElement("span");
      dot.className = "scale-dot";
      const label = document.createElement("span");
      label.className = "scale-label";
      label.textContent = labels[index];
      wrapper.append(input, dot, label);
      scale.append(wrapper);
    });

    $("[data-action='back']").disabled = state.current === 0;
    updateNextButton();
  }

  function updateNextButton() {
    const button = $("[data-action='next']");
    button.disabled = state.answers[state.current] === null;
    button.textContent =
      state.current === state.questionOrder.length - 1 ? "Meet my Ollie →" : "Next question →";
  }

  function nextQuestion() {
    if (state.answers[state.current] === null) return;
    if (state.current < state.questionOrder.length - 1) {
      state.current += 1;
      renderQuestion();
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    calculateScores();
  }

  function previousQuestion() {
    if (state.current === 0) return;
    state.current -= 1;
    renderQuestion();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function calculateScores() {
    state.scores = { chat: 0, study: 0, plan: 0 };
    state.questionOrder.forEach((question, index) => {
      state.scores[question.dimension] += state.answers[index];
    });
    state.pendingTies = Object.keys(state.scores).filter(
      (dimension) => state.scores[dimension] === 0
    );
    if (state.pendingTies.length) {
      renderTieBreaker();
    } else {
      runCalculation();
    }
  }

  function renderTieBreaker() {
    const dimension = state.pendingTies[0];
    const tie = data.tieBreakers[dimension];
    $("#tie-intro").textContent =
      state.pendingTies.length === 1
        ? "One dimension needs a final instinct check. No neutral answer this time."
        : `${state.pendingTies.length} dimensions need a final instinct check. No neutral answers this time.`;
    $("#tie-question-title").textContent = tie.title;
    $("#tie-context").textContent = tie.context;
    $("#tie-a").textContent = tie.a;
    $("#tie-b").textContent = tie.b;
    showView("tie");
  }

  function answerTie(value) {
    const dimension = state.pendingTies.shift();
    state.scores[dimension] = value;
    if (state.pendingTies.length) {
      renderTieBreaker();
    } else {
      runCalculation();
    }
  }

  function runCalculation() {
    showView("calculating");
    const messages = [
      "Inspecting your group-chat contribution…",
      "Checking when your academic powers activate…",
      "Investigating whether your calendar is legally binding…",
      "Locating your campus otter…",
    ];
    let index = 0;
    $("#calculating-message").textContent = messages[index];
    const interval = setInterval(() => {
      index += 1;
      if (index >= messages.length) {
        clearInterval(interval);
        buildResult();
        return;
      }
      $("#calculating-message").textContent = messages[index];
    }, 650);
  }

  function getResultCode() {
    const chat = state.scores.chat > 0 ? "Y" : "L";
    const study = state.scores.study > 0 ? "G" : "D";
    const plan = state.scores.plan > 0 ? "C" : "F";
    return `${chat}${study}${plan}`;
  }

  function buildResult() {
    state.resultCode = getResultCode();
    const result = data.results[state.resultCode];
    const artPath = `./assets/characters/${state.resultCode}.svg`;
    $("#result-art").src = artPath;
    $("#result-art").alt = `Placeholder character logo for ${result.name}`;
    $("#result-code").textContent = state.resultCode;
    $("#result-code-badge").textContent = state.resultCode;
    $("#result-code-badge").style.background = result.color;
    $("#result-name").textContent = result.name;
    $("#result-tagline").textContent = result.tagline;
    $("#result-description").textContent = result.description;
    $("#result-flop").textContent = result.flop;
    $("#result-role").textContent = result.role;

    const strengths = $("#result-strengths");
    strengths.innerHTML = "";
    result.strengths.forEach((strength) => {
      const li = document.createElement("li");
      li.textContent = strength;
      strengths.append(li);
    });

    renderDimensionBars();
    document.documentElement.style.setProperty("--result-color", result.color);
    showView("result");
  }

  function renderDimensionBars() {
    const bars = $("#dimension-bars");
    bars.innerHTML = "";
    Object.entries(data.dimensions).forEach(([key, dimension]) => {
      const score = state.scores[key];
      const aPercent = Math.round(50 + (score / 12) * 50);
      const bPercent = 100 - aPercent;
      const item = document.createElement("div");
      item.className = "dimension-item";
      item.innerHTML = `
        <div class="dimension-labels">
          <span>${dimension.a}</span>
          <strong>${Math.max(aPercent, bPercent)}%</strong>
          <span>${dimension.b}</span>
        </div>
        <div class="dimension-track">
          <span style="width:${aPercent}%"></span>
          <i style="left:${aPercent}%"></i>
        </div>
      `;
      bars.append(item);
    });
  }

  function wrapText(context, text, x, y, maxWidth, lineHeight, maxLines = 99) {
    const words = text.split(" ");
    let line = "";
    let lineNumber = 0;
    for (let i = 0; i < words.length; i += 1) {
      const testLine = `${line}${words[i]} `;
      if (context.measureText(testLine).width > maxWidth && i > 0) {
        context.fillText(line.trim(), x, y + lineNumber * lineHeight);
        line = `${words[i]} `;
        lineNumber += 1;
        if (lineNumber >= maxLines - 1) break;
      } else {
        line = testLine;
      }
    }
    if (lineNumber < maxLines) {
      context.fillText(line.trim(), x, y + lineNumber * lineHeight);
    }
    return y + (lineNumber + 1) * lineHeight;
  }

  function roundedRect(context, x, y, width, height, radius, fill) {
    context.beginPath();
    context.roundRect(x, y, width, height, radius);
    context.fillStyle = fill;
    context.fill();
  }

  async function loadImage(src) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = src;
    });
  }

  async function generateCardBlob() {
    const canvas = $("#share-canvas");
    const context = canvas.getContext("2d");
    const result = data.results[state.resultCode];
    const color = result.color;

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#fffaf0";
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.fillStyle = color;
    context.beginPath();
    context.arc(930, 120, 260, 0, Math.PI * 2);
    context.fill();
    context.globalAlpha = 0.1;
    context.beginPath();
    context.arc(100, 1190, 340, 0, Math.PI * 2);
    context.fill();
    context.globalAlpha = 1;

    context.fillStyle = "#062857";
    context.font = "700 70px Fredoka, sans-serif";
    context.fillText("Ollie", 74, 105);
    context.fillStyle = "#0aaeb5";
    context.fillText("cator", 235, 105);

    roundedRect(context, 70, 150, 940, 1060, 48, "#ffffff");

    try {
      const image = await loadImage(`./assets/characters/${state.resultCode}.svg`);
      context.drawImage(image, 315, 210, 450, 450);
    } catch {
      context.fillStyle = "#e8f8f6";
      context.beginPath();
      context.arc(540, 435, 220, 0, Math.PI * 2);
      context.fill();
    }

    roundedRect(context, 425, 620, 230, 64, 32, color);
    context.fillStyle = "#ffffff";
    context.font = "700 34px DM Sans, sans-serif";
    context.textAlign = "center";
    context.fillText(state.resultCode, 540, 663);

    context.fillStyle = "#062857";
    context.font = "700 64px Fredoka, sans-serif";
    const titleBottom = wrapText(context, result.name, 540, 770, 800, 72, 2);
    context.font = "500 34px DM Sans, sans-serif";
    context.fillStyle = "#3e516b";
    wrapText(context, result.tagline, 540, titleBottom + 20, 760, 48, 3);

    context.textAlign = "left";
    context.fillStyle = "#062857";
    context.font = "700 28px DM Sans, sans-serif";
    context.fillText("MY CAMPUS OPERATING SYSTEM", 125, 1040);

    const dimensions = [
      ["Y", "Group chat", state.scores.chat],
      ["G", "Study activation", state.scores.study],
      ["C", "Planning style", state.scores.plan],
    ];
    dimensions.forEach(([letter, label, score], index) => {
      const x = 125 + index * 290;
      const winningLetter =
        score > 0
          ? letter
          : letter === "Y"
            ? "L"
            : letter === "G"
              ? "D"
              : "F";
      context.fillStyle = color;
      context.font = "700 42px Fredoka, sans-serif";
      context.fillText(winningLetter, x, 1110);
      context.fillStyle = "#607086";
      context.font = "500 22px DM Sans, sans-serif";
      context.fillText(label, x + 48, 1106);
    });

    context.fillStyle = "#607086";
    context.font = "500 24px DM Sans, sans-serif";
    context.fillText("I entered the Olliecator. This is who came out.", 76, 1292);
    context.textAlign = "right";
    context.fillStyle = "#062857";
    context.font = "700 24px DM Sans, sans-serif";
    context.fillText("#MyOlliecator", 1000, 1292);
    context.textAlign = "left";

    return new Promise((resolve) => canvas.toBlob(resolve, "image/png", 1));
  }

  async function downloadCard() {
    const blob = await generateCardBlob();
    const link = document.createElement("a");
    link.download = `olliecator-${state.resultCode}.png`;
    link.href = URL.createObjectURL(blob);
    link.click();
    URL.revokeObjectURL(link.href);
    showToast("Your result card is ready!");
  }

  async function shareResult() {
    const result = data.results[state.resultCode];
    const blob = await generateCardBlob();
    const file = new File([blob], `olliecator-${state.resultCode}.png`, {
      type: "image/png",
    });
    const shareData = {
      title: `My Olliecator result: ${result.name}`,
      text: `I’m ${state.resultCode} — ${result.name}. What kind of campus otter are you?`,
      files: [file],
    };

    if (navigator.canShare?.(shareData)) {
      try {
        await navigator.share(shareData);
        return;
      } catch (error) {
        if (error.name === "AbortError") return;
      }
    }
    await downloadCard();
    showToast("Card downloaded—share it wherever the plot takes you.");
  }

  function showToast(message) {
    const toast = $("#toast");
    toast.textContent = message;
    toast.classList.add("toast--show");
    clearTimeout(showToast.timeout);
    showToast.timeout = setTimeout(() => toast.classList.remove("toast--show"), 3000);
  }

  document.addEventListener("click", (event) => {
    const actionTarget = event.target.closest("[data-action]");
    if (actionTarget) {
      const action = actionTarget.dataset.action;
      if (action === "start") startQuiz();
      if (action === "home") showView("landing");
      if (action === "next") nextQuestion();
      if (action === "back") previousQuestion();
      if (action === "restart") startQuiz();
      if (action === "download") downloadCard();
      if (action === "share") shareResult();
    }

    const tieTarget = event.target.closest("[data-tie-value]");
    if (tieTarget) answerTie(Number(tieTarget.dataset.tieValue));
  });
})();
