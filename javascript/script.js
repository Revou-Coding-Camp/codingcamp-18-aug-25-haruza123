console.log("JS loaded");

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("todo-form");
  const input = document.getElementById("todo-input");
  const dateInput = document.getElementById("todo-date");
  const list = document.getElementById("todo-list");
  const filterInput = document.getElementById("filter-input");
  const titleHelp = document.getElementById("title-help");
  const dateHelp = document.getElementById("date-help");
  const empty = document.getElementById("empty");
  const counter = document.getElementById("counter");
  const clearDoneBtn = document.getElementById("clear-done");
  const tabs = Array.from(document.querySelectorAll(".tab"));

  dateInput.min = new Date().toISOString().slice(0, 10);

  let todos = loadTodos();
  let view = { tab: "all", q: "" };

  render();

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const title = input.value.trim();
    const due = dateInput.value;

    [input, dateInput].forEach(el => el.classList.remove("input-error"));
    titleHelp.classList.add("hidden");
    dateHelp.classList.add("hidden");

    let ok = true;
    if (!title) {
      input.classList.add("input-error");
      titleHelp.classList.remove("hidden");
      ok = false;
    }
    if (!due || due < dateInput.min) {
      dateInput.classList.add("input-error");
      dateHelp.classList.remove("hidden");
      ok = false;
    }
    if (!ok) return;

    const newTodo = {
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      title,
      due,              
      createdAt: Date.now(),
      done: false,
    };

    todos.push(newTodo);
    saveTodos();
    form.reset();
    input.focus();
    render();
  });

  filterInput.addEventListener("input", () => {
    view.q = filterInput.value.toLowerCase();
    render();
  });

  tabs.forEach(btn => {
    btn.addEventListener("click", () => {
      tabs.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      view.tab = btn.dataset.filter;
      render();
    });
  });

  clearDoneBtn.addEventListener("click", () => {
    todos = todos.filter(t => !t.done);
    saveTodos();
    render();
  });

  list.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;
    const action = btn.dataset.action;
    const id = btn.dataset.id;

    if (action === "toggle") {
      todos = todos.map(t => t.id === id ? { ...t, done: !t.done } : t);
      saveTodos(); render();
    }
    if (action === "delete") {
      todos = todos.filter(t => t.id !== id);
      saveTodos(); render();
    }
  });

  list.addEventListener("dblclick", (e) => {
    const p = e.target.closest("p[data-id]");
    if (!p) return;
    const id = p.dataset.id;
    const todo = todos.find(t => t.id === id);
    if (!todo) return;

    const inputEdit = document.createElement("input");
    inputEdit.type = "text";
    inputEdit.value = todo.title;
    inputEdit.className = "border rounded px-2 py-1 w-full";

    p.replaceWith(inputEdit);
    inputEdit.focus();
    inputEdit.selectionStart = inputEdit.value.length;

    const commit = () => {
      const val = inputEdit.value.trim();
      todo.title = val || todo.title; 
      saveTodos(); render();
    };
    inputEdit.addEventListener("blur", commit);
    inputEdit.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter") commit();
      if (ev.key === "Escape") render();
    });
  });

  function render() {
    let items = [...todos];
    if (view.tab === "active") items = items.filter(t => !t.done);
    if (view.tab === "done") items = items.filter(t => t.done);
    if (view.q) {
      items = items.filter(t =>
        t.title.toLowerCase().includes(view.q) ||
        formatDateReadable(t.due).toLowerCase().includes(view.q)
      );
    }

    items.sort((a, b) => {
      const d = new Date(a.due) - new Date(b.due);
      return d !== 0 ? d : a.createdAt - b.createdAt;
    });

    const left = todos.filter(t => !t.done).length;
    counter.textContent = `${left} tugas`;

    if (items.length === 0) {
      list.innerHTML = "";
      empty.classList.remove("hidden");
      return;
    }
    empty.classList.add("hidden");

    const frag = document.createDocumentFragment();
    items.forEach(item => {
      const li = document.createElement("li");
      li.className = "flex items-center justify-between gap-2 p-3 border rounded hover:bg-gray-50";

      li.innerHTML = `
        <div class="flex items-start gap-3">
          <button data-action="toggle" data-id="${item.id}"
            class="shrink-0 w-5 h-5 mt-1 border rounded flex items-center justify-center ${item.done ? 'bg-green-500 text-white' : 'bg-white'}"
            title="Tandai selesai">${item.done ? "✓" : ""}</button>
          <div>
            <p data-id="${item.id}" class="font-medium ${item.done ? 'line-through-soft' : ''}">
              ${escapeHTML(item.title)}
            </p>
            <p class="text-sm text-gray-500">Jatuh tempo: ${formatDateReadable(item.due)}</p>
          </div>
        </div>
        <button data-action="delete" data-id="${item.id}" class="btn-delete px-3 py-1 rounded">Hapus</button>
      `;
      frag.appendChild(li);
    });
    list.innerHTML = "";
    list.appendChild(frag);
  }

  function saveTodos() {
    localStorage.setItem("todos", JSON.stringify(todos));
  }
  function loadTodos() {
    try {
      const raw = localStorage.getItem("todos");
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  }
  function formatDateReadable(yyyyMMdd) {
    const [y, m, d] = yyyyMMdd.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
  }
  function escapeHTML(str) {
    return str.replace(/[&<>"']/g, (m) => (
      { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[m]
    ));
  }
});
