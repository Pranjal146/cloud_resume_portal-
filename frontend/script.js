const API_URL = "PASTE_API_GATEWAY_INVOKE_URL_HERE";

async function loadResume() {
  try {
    const response = await fetch(API_URL);
    const data = await response.json();

    document.getElementById("profile").textContent = data.summary;

    const skillsList = document.getElementById("skills");
    skillsList.innerHTML = "";
    data.skills.forEach(skill => {
      const li = document.createElement("li");
      li.textContent = skill;
      skillsList.appendChild(li);
    });
  } catch (error) {
    document.getElementById("profile").textContent = "Error loading API data. Check API Gateway URL and CORS.";
    console.error(error);
  }
}

function saveNote() {
  const input = document.getElementById("noteInput");
  const note = input.value.trim();
  if (!note) return;

  const notes = JSON.parse(localStorage.getItem("cloudNotes")) || [];
  notes.push(note);
  localStorage.setItem("cloudNotes", JSON.stringify(notes));
  input.value = "";
  showNotes();
}

function showNotes() {
  const notes = JSON.parse(localStorage.getItem("cloudNotes")) || [];
  const notesList = document.getElementById("notes");
  notesList.innerHTML = "";

  notes.forEach(note => {
    const li = document.createElement("li");
    li.textContent = note;
    notesList.appendChild(li);
  });
}

showNotes();
