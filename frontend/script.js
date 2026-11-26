
// YOUR MIND - LOCAL FRONTEND

// MOODBOARD FRONTEND

const notes = document.querySelectorAll(".note");
const selectionCount = document.getElementById("selection-count");
const feelingText = document.getElementById("feeling-note");
const charCount = document.getElementById("character-count");
const saveButton = document.getElementById("save-button");
const statusMessage = document.getElementById("status-message");
const historyContainer = document.getElementById("prev-list");
const refreshButton = document.getElementById("refresh-button");

// LOCAL EXPRESS API

const API_URL = "/api/entries";

const selectedColors = new Set();

// Visitor identification

let visitorId = localStorage.getItem("yourmind");

if (!visitorId) {
    visitorId = crypto.randomUUID();
    localStorage.setItem("yourmind", visitorId);
}

// Colour selection

notes.forEach(note => {

    note.setAttribute("aria-pressed", "false");

    note.addEventListener("click", () => {

        const color = note.dataset.color;

        if (!color) return;

        if (selectedColors.has(color)) {

            selectedColors.delete(color);

            note.classList.remove("selected");

            note.setAttribute("aria-pressed", "false");

        } else {

            selectedColors.add(color);

            note.classList.add("selected");

            note.setAttribute("aria-pressed", "true");

        }

        updateSelectionCount();

    });

});

// Update selection count

function updateSelectionCount() {

    const count = selectedColors.size;

    selectionCount.textContent =
        `${count} ${count === 1 ? "selected" : "selected"}`;

}

// Character counter

feelingText.addEventListener("input", () => {

    charCount.textContent =
        `${feelingText.value.length} / 2000`;

});

// Status messages

function showStatus(message, isError = false) {

    statusMessage.textContent = message;

    statusMessage.style.color =
        isError ? "#b75b52" : "#66866a";

}

// Save entry

saveButton.addEventListener("click", async () => {

    const colors = Array.from(selectedColors);

    const text = feelingText.value.trim();

    if (colors.length === 0 && text.length === 0) {

        showStatus(
            "There's no need for labels here",
            true
        );

        return;

    }

    saveButton.disabled = true;

    saveButton.textContent = "Recalling...";

    try {

        const response = await fetch(API_URL, {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({

                visitorId: visitorId,

                colors: colors,

                note: text

            })

        });

        const result = await response.json();

        if (!response.ok) {

            throw new Error(
                result.message || "Unable to save your thoughts."
            );

        }

        showStatus(
            "Thank you for opening your heart."
        );

        // Reset selections

        selectedColors.clear();

        notes.forEach(note => {

            note.classList.remove("selected");

            note.setAttribute("aria-pressed", "false");

        });

        // Reset written reflection

        feelingText.value = "";

        charCount.textContent = "0 / 2000";

        updateSelectionCount();

        // Refresh history

        await loadHistory();

    } catch (error) {

        showStatus(error.message, true);

        console.error("Save error:", error);

    } finally {

        saveButton.disabled = false;

        saveButton.textContent = "Let's have a thought";

    }

});

// Load previous entries

async function loadHistory() {

    if (!historyContainer) return;

    historyContainer.textContent =
        "Recalling memories...";

    try {

        const response = await fetch(
            `${API_URL}?visitorId=${encodeURIComponent(visitorId)}`
        );

        const result = await response.json();

        if (!response.ok) {

            throw new Error(
                result.message || "Unable to retrieve memories."
            );

        }

        renderHistory(result.entries || []);

    } catch (error) {

        historyContainer.textContent =
            "Unable to recall your memories.";

        console.error("History error:", error);

    }

}

// Display previous entries

// Display previous entries

function renderHistory(entries) {

    historyContainer.replaceChildren();

    if (entries.length === 0) {

        const empty = document.createElement("p");

        empty.className = "empty-state";

        empty.textContent =
            "You have yet to open your heart, why not start now?";

        historyContainer.appendChild(empty);

        return;

    }

    entries.forEach(entry => {

        const card = document.createElement("article");

        // MATCHES YOUR CSS: .prev-card
        card.className = "prev-card";

        // Display date
        const date = document.createElement("p");

        date.className = "prev-date";

        date.textContent = new Date(entry.createdAt)
            .toLocaleString(undefined, {
                dateStyle: "medium",
                timeStyle: "short"
            });

        card.appendChild(date);

        // Display selected colours
        const colorContainer = document.createElement("div");

        // MATCHES YOUR CSS: .prev-colors
        colorContainer.className = "prev-colors";

        (entry.colors || []).forEach(color => {

            const colorNote = document.createElement("span");

            // MATCHES YOUR CSS: .prev-dot
            colorNote.className = "prev-dot";

            colorNote.style.backgroundColor = color;

            colorContainer.appendChild(colorNote);

        });

        // Only add colour container if colours exist
        if (entry.colors && entry.colors.length > 0) {
            card.appendChild(colorContainer);
        }

        // Display written reflection
        if (entry.note) {

            const text = document.createElement("p");

            // MATCHES YOUR CSS: .prev-thought
            text.className = "prev-thought";

            text.textContent = entry.note;

            card.appendChild(text);

        }

        historyContainer.appendChild(card);

    });

}

// Refresh history

refreshButton.addEventListener("click", loadHistory);

// Initialisation

updateSelectionCount();

charCount.textContent =
    `${feelingText.value.length} / 2000`;

loadHistory();
