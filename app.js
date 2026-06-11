const state = {
  currentWriter: "pen",
  currentInbox: "moon",
  letters: [],
  deletedLetters: [],
  readLetterIds: [],
  deliveredCount: 0,
  binUnlocked: false,
  cloudReady: false,
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const introScreen = $('[data-screen="intro"]');
const roomScreen = $('[data-screen="room"]');
const composer = $("[data-composer]");
const titleInput = $("[data-title]");
const bodyInput = $("[data-body]");
const stampInput = $("[data-stamp]");
const deliveryInput = $("[data-delivery]");
const letterList = $("[data-letter-list]");
const template = $("#letter-template");
const binPanel = $("[data-bin-panel]");
const binLock = $("[data-bin-lock]");
const binPin = $("[data-bin-pin]");
const binList = $("[data-bin-list]");
const binTemplate = $("#bin-template");

const walletNames = {
  moon: "Moon Girl",
  pen: "Pen Boy",
};

const receiverFor = (writer) => (writer === "pen" ? "moon" : "pen");

const deliveryOptions = {
  air: {
    label: "✈️ Air Mail",
    hours: 18,
  },
  express: {
    label: "🚀 Express Mail",
    hours: 1,
  },
};

const deliveryMessages = [
  "💌 Leaving the mailbox...",
  "💌 Preparing for delivery...",
  "💌 Carefully sealing the envelope...",
  "💌 Beginning its journey...",
  "💌 Heading down a quiet road...",
  "💌 Crossing a small town...",
  "💌 Traveling through the countryside...",
  "💌 Making its way across the horizon...",
  "💌 Following the moonlight...",
  "💌 Drifting beneath the stars...",
  "💌 Riding a gentle breeze...",
  "💌 Crossing a distant river...",
  "💌 Moving through the night...",
  "💌 Passing sleepy villages...",
  "💌 Traveling across rolling hills...",
  "💌 Making steady progress...",
  "💌 Taking the scenic route...",
  "💌 Following an old postal trail...",
  "💌 Traveling beyond the clouds...",
  "💌 Crossing open waters...",
  "💌 Sailing across the sea...",
  "💌 Riding ocean winds...",
  "💌 Traveling over distant shores...",
  "💌 Exploring faraway places...",
  "💌 Passing through another timezone...",
  "💌 Crossing international borders...",
  "💌 Flying above the clouds...",
  "💌 Following the northern stars...",
  "💌 Taking a shortcut through moonlight...",
  "💌 Guided by starlight...",
  "💌 Traveling through a quiet night sky...",
  "💌 Getting closer every hour...",
  "💌 Drawing nearer to its destination...",
  "💌 Almost halfway there...",
  "💌 More than halfway there...",
  "💌 Passing through a busy post office...",
  "💌 Receiving special handling...",
  "💌 Protected from the rain...",
  "💌 Escorted by friendly fireflies...",
  "💌 Dancing through the clouds...",
  "💌 Following a trail of shooting stars...",
  "💌 Nearing familiar skies...",
  "💌 Entering the destination region...",
  "💌 Looking for the right mailbox...",
  "💌 Double-checking the address...",
  "💌 Making final preparations...",
  "💌 Just around the corner...",
  "💌 Nearly delivered...",
  "💌 Arriving very soon...",
  "💌 Reaching its destination...",
];

const finalDeliveryMessages = [
  "🌙 Moonlight is guiding this letter...",
  "✨ The stars are watching over this delivery...",
  "🕊️ Carrying precious words across the world...",
  "💌 A heartfelt message is on its way...",
  "🌠 Traveling through a sky full of wishes...",
  "🌙 The moon has approved this delivery...",
  "✒️ Fresh ink is still drying on the page...",
  "💫 Crossing oceans to reach someone special...",
  "🌹 Protecting the words inside...",
  "🦋 A beautiful message is fluttering closer...",
];

const formatDate = (value) =>
  new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));

async function setupCloud() {
  try {
    const response = await fetch("/api/letters");
    if (!response.ok) {
      throw new Error("Cloud endpoint is not ready");
    }

    state.letters = await response.json();
    state.cloudReady = true;
    saveLocalLetters();
    render();
    setCloudStatus("GitHub synced", "cloud");
  } catch (error) {
    console.info(error.message);
    setCloudStatus("Local preview", "local");
  }
}

function setCloudStatus(label, mode) {
  const status = $("[data-cloud-status]");
  status.querySelector("span:last-child").textContent = label;
  status.dataset.mode = mode;
}

function loadLocalLetters() {
  const saved = localStorage.getItem("moon-pen-letters");
  state.letters = saved ? JSON.parse(saved) : [];
  const savedDeleted = localStorage.getItem("moon-pen-deleted-letters");
  state.deletedLetters = savedDeleted ? JSON.parse(savedDeleted) : [];
  const savedRead = localStorage.getItem("moon-pen-read-letters");
  state.readLetterIds = savedRead ? JSON.parse(savedRead) : [];
}

function saveLocalLetters() {
  localStorage.setItem("moon-pen-letters", JSON.stringify(state.letters));
}

function saveDeletedLetters() {
  localStorage.setItem("moon-pen-deleted-letters", JSON.stringify(state.deletedLetters));
}

function saveReadLetters() {
  localStorage.setItem("moon-pen-read-letters", JSON.stringify(state.readLetterIds));
}

function updateComposerRoute() {
  const receiver = receiverFor(state.currentWriter);
  $("[data-compose-route]").textContent = `${walletNames[state.currentWriter]} to ${walletNames[receiver]}`;
}

function renderCounts() {
  ["moon", "pen"].forEach((wallet) => {
    const count = state.letters.filter((letter) => letter.to === wallet).length;
    $(`[data-count="${wallet}"]`).textContent = count;
  });
}

function renderStats() {
  const deliveredLetters = state.letters.filter(isDelivered);
  const words = state.letters.reduce((total, letter) => total + countWords(letter.body), 0);
  const unread = deliveredLetters.filter((letter) => !state.readLetterIds.includes(getLetterId(letter))).length;
  state.deliveredCount = deliveredLetters.length;

  $('[data-stat="letters"]').textContent = deliveredLetters.length;
  $('[data-stat="words"]').textContent = words;
  $('[data-stat="unread"]').textContent = unread;
}

function renderInbox() {
  $("[data-inbox-title]").textContent = `${walletNames[state.currentInbox]} wallet`;
  $$("[data-filter]").forEach((button) => {
    button.classList.toggle("active", button.dataset.filter === state.currentInbox);
  });

  const letters = state.letters.filter((letter) => letter.to === state.currentInbox);
  letterList.innerHTML = "";

  if (!letters.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "No letters here yet. Send one with love.";
    letterList.append(empty);
    return;
  }

  letters.forEach((letter) => {
    const card = template.content.firstElementChild.cloneNode(true);
    const delivered = isDelivered(letter);
    const letterId = getLetterId(letter);
    const delivery = getDeliveryInfo(letter);

    card.dataset.letterId = letterId;
    card.classList.toggle("arriving", !delivered);
    card.classList.toggle("unread", delivered && !state.readLetterIds.includes(letterId));
    card.querySelector(".letter-meta").textContent = `From ${walletNames[letter.from]} - ${formatDate(letter.createdAt)}`;
    card.querySelector(".letter-title").textContent = letter.title;
    card.querySelector(".letter-stamp").textContent = letter.stamp || "💌 Secret Stamp";
    card.querySelector(".arrival-status").textContent = delivered
      ? `${delivery.label} arrived`
      : getArrivalText(letter);
    card.querySelector(".letter-body").textContent = letter.body;
    const envelopeButton = card.querySelector(".letter-envelope");
    envelopeButton.setAttribute("aria-disabled", String(!delivered));
    envelopeButton.addEventListener("click", () => {
      if (!isDelivered(letter)) return;
      const isOpen = card.classList.toggle("open");
      envelopeButton.setAttribute("aria-expanded", String(isOpen));
      if (isOpen && !state.readLetterIds.includes(letterId)) {
        state.readLetterIds = [...state.readLetterIds, letterId];
        saveReadLetters();
        card.classList.remove("unread");
        renderStats();
      }
    });
    card.querySelector(".delete-letter").addEventListener("click", () => {
      deleteLetter(letter);
    });
    letterList.append(card);
  });
}

function render() {
  renderCounts();
  renderStats();
  renderInbox();
  renderBin();
  updateComposerRoute();
}

async function sendLetter(event) {
  event.preventDefault();

  const delivery = deliveryOptions[deliveryInput.value] || deliveryOptions.air;
  const now = Date.now();
  const letter = {
    id: globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
    title: titleInput.value.trim(),
    body: bodyInput.value.trim(),
    stamp: stampInput.value,
    deliveryType: deliveryInput.value,
    deliveryLabel: delivery.label,
    deliverAt: new Date(now + delivery.hours * 60 * 60 * 1000).toISOString(),
    from: state.currentWriter,
    to: receiverFor(state.currentWriter),
    createdAt: new Date(now).toISOString(),
  };

  if (!letter.title || !letter.body) return;

  if (state.cloudReady) {
    try {
      const response = await fetch("/api/letters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(letter),
      });

      if (!response.ok) {
        throw new Error("Could not save to GitHub");
      }

      state.letters = await response.json();
      saveLocalLetters();
    } catch (error) {
      console.info(error.message);
      setCloudStatus("Local preview", "local");
      state.cloudReady = false;
      state.letters = [letter, ...state.letters];
      saveLocalLetters();
    }
  } else {
    state.letters = [letter, ...state.letters];
    saveLocalLetters();
  }

  state.currentInbox = letter.to;
  composer.reset();
  render();
}

async function deleteLetter(letter) {
  state.letters = state.letters.filter((item) => getLetterId(item) !== getLetterId(letter));
  state.deletedLetters = [{ ...letter, deletedAt: new Date().toISOString() }, ...state.deletedLetters];
  saveLocalLetters();
  saveDeletedLetters();
  render();

  if (!state.cloudReady) return;

  try {
    const response = await fetch(`/api/letters?id=${encodeURIComponent(getLetterId(letter))}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Could not delete from GitHub");
    }

    state.letters = await response.json();
    saveLocalLetters();
    render();
  } catch (error) {
    console.info(error.message);
    setCloudStatus("Local preview", "local");
    state.cloudReady = false;
  }
}

function getLetterId(letter) {
  return letter.id || `${letter.from}-${letter.to}-${letter.createdAt}-${letter.title}`;
}

function getDeliveryInfo(letter) {
  const option = deliveryOptions[letter.deliveryType] || {};
  return {
    label: letter.deliveryLabel || option.label || "💌 Letter Mail",
    deliverAt: letter.deliverAt || letter.createdAt,
  };
}

function isDelivered(letter) {
  return new Date(getDeliveryInfo(letter).deliverAt).getTime() <= Date.now();
}

function formatTimeLeft(value) {
  const remaining = Math.max(0, new Date(value).getTime() - Date.now());
  const hours = Math.floor(remaining / 3600000);
  const minutes = Math.floor((remaining % 3600000) / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);

  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

function getArrivalText(letter) {
  const delivery = getDeliveryInfo(letter);
  const remaining = Math.max(0, new Date(delivery.deliverAt).getTime() - Date.now());
  const messages = remaining <= 5 * 60 * 1000 ? finalDeliveryMessages : deliveryMessages;
  const index = Math.floor(Date.now() / 3000) % messages.length;
  return `${formatTimeLeft(delivery.deliverAt)} • ${messages[index]}`;
}

function countWords(value) {
  return String(value || "").trim().split(/\s+/).filter(Boolean).length;
}

function updateCountdowns() {
  const deliveredCount = state.letters.filter(isDelivered).length;
  if (deliveredCount !== state.deliveredCount) {
    render();
    return;
  }

  $$(".letter-card.arriving").forEach((card) => {
    const letter = state.letters.find((item) => getLetterId(item) === card.dataset.letterId);
    if (!letter) return;

    card.querySelector(".arrival-status").textContent = getArrivalText(letter);
  });
}

function renderBin() {
  if (!state.binUnlocked) return;

  binList.innerHTML = "";

  if (!state.deletedLetters.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "No deleted letters here.";
    binList.append(empty);
    return;
  }

  state.deletedLetters.forEach((letter) => {
    const item = binTemplate.content.firstElementChild.cloneNode(true);
    item.querySelector(".letter-meta").textContent = `Deleted ${formatDate(letter.deletedAt || letter.createdAt)}`;
    item.querySelector("h3").textContent = letter.title;
    item.querySelector("small").textContent = letter.stamp || "💌 Secret Stamp";
    item.querySelector("[data-restore-letter]").addEventListener("click", () => restoreLetter(letter));
    binList.append(item);
  });
}

function restoreLetter(letter) {
  const restored = { ...letter };
  delete restored.deletedAt;
  state.deletedLetters = state.deletedLetters.filter((item) => getLetterId(item) !== getLetterId(letter));
  state.letters = [restored, ...state.letters];
  saveDeletedLetters();
  saveLocalLetters();
  render();
}

$("[data-open-envelope]").addEventListener("click", () => {
  introScreen.classList.add("pop-open");
  window.setTimeout(() => {
    introScreen.classList.add("hidden");
    roomScreen.classList.remove("hidden");
  }, 680);
});

$$("[data-compose]").forEach((button) => {
  button.addEventListener("click", () => {
    state.currentWriter = button.dataset.compose;
    composer.classList.remove("hidden");
    titleInput.focus();
    render();
  });
});

$$("[data-filter]").forEach((button) => {
  button.addEventListener("click", () => {
    state.currentInbox = button.dataset.filter;
    render();
  });
});

$("[data-close-composer]").addEventListener("click", () => {
  composer.classList.add("hidden");
});

composer.addEventListener("submit", sendLetter);
$("[data-open-bin]").addEventListener("click", () => {
  binPanel.classList.remove("hidden");
  if (!state.binUnlocked) {
    binPin.focus();
  }
});

$("[data-close-bin]").addEventListener("click", () => {
  binPanel.classList.add("hidden");
});

binLock.addEventListener("submit", (event) => {
  event.preventDefault();
  const error = $("[data-bin-error]");

  if (binPin.value !== "1256") {
    error.textContent = "Wrong PIN.";
    return;
  }

  state.binUnlocked = true;
  error.textContent = "";
  binLock.classList.add("hidden");
  binList.classList.remove("hidden");
  renderBin();
});
window.setInterval(updateCountdowns, 1000);

loadLocalLetters();
render();
setupCloud();
