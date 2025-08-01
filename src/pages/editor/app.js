const seatTypes = {};
let activeType = null;
let isDragging = false;
let isEraser = false;
let selectedColor = "#3f4696ff"; // valor inicial por defecto
let selectedColorAsiento = "#95013d"; // valor inicial por defecto
let isAisleMode = false;
let isOffsetMode = false;

//TODO: arreglar que al importar pueda seleccionar asientos desde
// COLOR
const pickr = Pickr.create({
  el: "#color-picker",
  theme: "classic", // o 'monolith' o 'nano'

  default: selectedColor,

  components: {
    // Main components
    preview: true,
    opacity: true,
    hue: true,

    // Input / output Options
    interaction: {
      hex: true,
      rgba: true,
      input: true,
      clear: true,
      save: true,
    },
  },
});

const pickrSelected = Pickr.create({
  el: "#selected-color-picker",
  theme: "classic", // o 'monolith' o 'nano'

  default: selectedColorAsiento,

  components: {
    // Main components
    preview: true,
    opacity: true,
    hue: true,

    // Input / output Options
    interaction: {
      hex: true,
      rgba: true,
      input: true,
      clear: true,
      save: true,
    },
  },
});

// Al guardar color en el picker
pickr.on("save", (color, instance) => {
  selectedColor = color.toHEXA().toString();
});

pickrSelected.on("save", (color, instance) => {
  selectedColorAsiento = color.toHEXA().toString();
});

// GET ETIQUETAS
function getLabels(mode, count, customInput) {
  switch (mode) {
    case "number":
      return Array.from({ length: count }, (_, i) => i + 1);
    case "letter":
      return Array.from({ length: count }, (_, i) =>
        String.fromCharCode(65 + i)
      ); // A, B, C...
    case "odd":
      return Array.from({ length: count }, (_, i) => 1 + i * 2);
    case "even":
      return Array.from({ length: count }, (_, i) => 2 + i * 2);
    case "custom":
      return customInput
        .split(",")
        .map((label) => label.trim())
        .slice(0, count);
    default:
      return Array.from({ length: count }, (_, i) => i + 1);
  }
}

// DRAG PARA PINTAR ASIENTOS
document.addEventListener("mousedown", (e) => {
  if (!e.target.classList.contains("seat")) return;
  isDragging = true;
  // handleSeatClick(e.target);
});

document.addEventListener("mousemove", (e) => {
  if (!isDragging) return;
  if (!e.target.classList.contains("seat")) return;

  if (isAisleMode) {
    markAsAisle(e.target);
  } else {
    applyTool(e.target);
  }
});

document.addEventListener("mouseup", () => {
  isDragging = false;
});

// TOGGLE
function toggleAisleForSeat(seat) {
  if (!seat.classList.contains("seat")) return;

  const isAisle = seat.dataset.isAisle === "true";

  if (isAisle) {
    seat.classList.remove("aisle", "disabled");
    seat.dataset.isAisle = "false";
    seat.dataset.type = "";
    seat.style.backgroundColor = "#eee";
  } else {
    seat.classList.add("aisle", "disabled");
    seat.dataset.isAisle = "true";
    seat.dataset.type = "disabled";
    seat.style.backgroundColor = "#ccc";
  }
}

function toggleOffsetForSeat(seat) {
  const isOffset = seat.dataset.type === "offset";

  if (isOffset) {
    // Desactivar offset
    seat.dataset.type = "";
    seat.classList.remove("offset");
    seat.dataset.isAisle = "false";
    seat.style.backgroundColor = "#eee";
  } else {
    // Activar offset
    seat.dataset.type = "offset";
    seat.classList.add("offset");
    seat.dataset.isAisle = "false";
    seat.classList.remove("aisle", "disabled");
    seat.style.backgroundColor = "#ccc";
  }
}

function markAsAisle(seat) {
  if (!seat.classList.contains("seat")) return;
  if (seat.dataset.isAisle === "true") return; // Ya es pasillo

  seat.classList.add("aisle", "disabled");
  seat.dataset.isAisle = "true";
  seat.dataset.type = "disabled";
  seat.style.backgroundColor = "#ccc";
}

// MODO BORRADOR
function toggleEraser() {
  isEraser = !isEraser;

  // 🔧 Desactiva modo pasillo si el borrador se activa
  if (isEraser) {
    isAisleMode = false;
    isOffsetMode = false;
    aisleButton.textContent = "🛣️ Deshabilitar asientos: OFF";
    offsetButton.textContent = "↔️ Modo Offset: OFF";
    aisleButton.classList.remove("active");
    offsetButton.classList.remove("active");
  }

  const eraserButton = document.getElementById("eraserButton");
  eraserButton.classList.toggle("active", isEraser);
}

function applyTool(seat) {
  // if (!seat.classList.contains('seat') || seat.dataset.isAisle === 'true') return;
  if (!seat.classList.contains("seat")) return;

  if (isEraser) {
    seat.dataset.type = "";
    seat.classList.remove("aisle", "disabled", "offset");
    seat.dataset.isAisle = "false";
    seat.style.backgroundColor = "#eee";
    return;
  } else {
    paintSeat(seat);
  }
}

function paintSeat(seat) {
  if (!activeType || !seatTypes[activeType]) return;
  if (seat.dataset.isAisle === "true") return; // 🔒 Ignora pasillos
  const current = seat.dataset.type;

  if (isDragging) {
    // Si estás haciendo drag, solo cambia si es diferente
    if (current !== activeType) {
      seat.dataset.type = activeType;
      seat.style.backgroundColor = seatTypes[activeType].color;
    }
  } else {
    // Si es clic suelto, permite toggle
    if (current === activeType) {
      seat.dataset.type = "";
      seat.style.backgroundColor = "#eee";
    } else {
      seat.dataset.type = activeType;
      seat.style.backgroundColor = seatTypes[activeType].color;
    }
  }
}

// MANEJAR CLICK
function handleSeatClick(seat) {
  if (!seat.classList.contains("seat")) return;

  if (isEraser) {
    applyTool(seat);
    return;
  }

  if (isAisleMode) {
    toggleAisleForSeat(seat);
    return;
  }

  if (isOffsetMode) {
    toggleOffsetForSeat(seat);
    return;
  } else {
    applyTool(seat); // paintSeat incluida aquí
  }
}

// Guarda el estado actual
function getSeatData() {
  const seatElements = document.querySelectorAll(".seat");
  const seatData = {};
  seatElements.forEach((seat) => {
    const r = parseInt(seat.dataset.row);
    const c = parseInt(seat.dataset.col);
    seatData[`${r},${c}`] = {
      type: seat.dataset.type,
      isAisle: seat.dataset.isAisle,
      bg: seat.style.backgroundColor,
    };
  });
  return seatData;
}

// Restaura el estado
function restoreSeatData(seatData) {
  const seats = document.querySelectorAll(".seat");
  seats.forEach((seat) => {
    const r = parseInt(seat.dataset.row);
    const c = parseInt(seat.dataset.col);
    const data = seatData[`${r},${c}`];
    if (data) {
      seat.dataset.type = data.type;
      seat.dataset.isAisle = data.isAisle;
      seat.style.backgroundColor = data.bg;
      seat.classList.remove("disabled", "aisle", "offset");
      if (data.type === "disabled") {
        seat.classList.add("disabled", "aisle");
      } else if (data.type === "offset") {
        seat.classList.add("offset");
      }
    }
  });
}

// GENERAR EL GRID
function generateGrid() {
  const rows = parseInt(document.getElementById("rows").value);
  const cols = parseInt(document.getElementById("cols").value);
  const seatMap = document.getElementById("seatMap");

  // const rowMode = document.querySelector('input[name="rowLabelMode"]:checked').value;
  // const colMode = document.querySelector('input[name="colLabelMode"]:checked').value;
  // const rowCustom = document.getElementById('customRowLabels').value;
  // const colCustom = document.getElementById('customColLabels').value;

  // const rowLabels = getLabels(rowMode, rows, rowCustom);
  // const colLabels = getLabels(colMode, cols, colCustom);

  seatMap.innerHTML = "";
  // seatMap.style.gridTemplateColumns = `repeat(${cols}, 20px)`;

  for (let r = 0; r < rows; r++) {
    const rowDiv = document.createElement("div");
    rowDiv.className = "seat-row";

    for (let c = 0; c < cols; c++) {
      const div = document.createElement("div");
      div.className = "seat";
      div.dataset.row = r;
      div.dataset.col = c;
      div.dataset.type = "";
      // div.title = `Fila ${rowLabels[r]} - Columna ${colLabels[c]}`;

      div.addEventListener("click", (e) => {
        handleSeatClick(e.target);
      });

      // 👇 Agrega aquí el listener para el menú contextual
      div.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        showContextMenu(e, r, c);
      });

      rowDiv.appendChild(div);
    }
    seatMap.appendChild(rowDiv);
  }
}

// AGREGA FILAS
function insertRowAt(index) {
  const rowInput = document.getElementById("rows");
  const cols = parseInt(document.getElementById("cols").value);
  let rows = parseInt(rowInput.value);

  const seatData = getSeatData();
  const newSeatData = {};
  // Construye nuevo estado con la fila vacía insertada
  for (let r = 0; r < rows + 1; r++) {
    for (let c = 0; c < cols; c++) {
      if (r < index) {
        // Copia filas anteriores
        const prev = seatData[`${r},${c}`];
        if (prev) newSeatData[`${r},${c}`] = prev;
      } else if (r === index) {
        // Nueva fila vacía
        newSeatData[`${r},${c}`] = { type: "", isAisle: "false", bg: "" };
      } else {
        // Copia filas posteriores, desplazadas +1
        const prev = seatData[`${r - 1},${c}`];
        if (prev) newSeatData[`${r},${c}`] = prev;
      }
    }
  }

  rowInput.value = rows + 1;
  // Aquí se actualiza la estructura de datos
  generateGrid();
  restoreSeatData(newSeatData);
}

// AGREGA COLUMNAS
function insertColAt(index) {
  const colInput = document.getElementById("cols");
  const rows = parseInt(document.getElementById("rows").value);
  let cols = parseInt(colInput.value);

  const seatData = getSeatData();
  const newSeatData = {};
  // Construye nuevo estado con la columna vacía insertada
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols + 1; c++) {
      if (c < index) {
        // Copia columnas anteriores
        const prev = seatData[`${r},${c}`];
        if (prev) newSeatData[`${r},${c}`] = prev;
      } else if (c === index) {
        // Nueva columna vacía
        newSeatData[`${r},${c}`] = { type: "", isAisle: "false", bg: "" };
      } else {
        // Copia columnas posteriores, desplazadas +1
        const prev = seatData[`${r},${c - 1}`];
        if (prev) newSeatData[`${r},${c}`] = prev;
      }
    }
  }

  colInput.value = cols + 1;
  // Aquí se actualiza la estructura de datos
  generateGrid();
  restoreSeatData(newSeatData);
}

// Botón toggle modo pasillo
const aisleButton = document.getElementById("toggleAisleMode");
aisleButton.addEventListener("click", () => {
  isAisleMode = !isAisleMode;

  // 🔧 Desactivar borrador al activar modo pasillo
  if (isAisleMode) {
    isOffsetMode = false;
    isEraser = false;
    offsetButton.classList.remove("active");
    offsetButton.textContent = "↔️ Modo Offset: OFF";
    document.getElementById("eraserButton").classList.remove("active");
  }
  aisleButton.classList.toggle("active", isAisleMode);
  aisleButton.textContent = `🛣️ Deshabilitar asientos: ${
    isAisleMode ? "ON" : "OFF"
  }`;
});

// Botón toggle modo offset
const offsetButton = document.getElementById("toggleOffsetMode");
offsetButton.addEventListener("click", () => {
  isOffsetMode = !isOffsetMode;

  // 🔧 Si activas offset, desactiva pasillo y borrador
  if (isOffsetMode) {
    isAisleMode = false;
    isEraser = false;
    aisleButton.textContent = "🛣️ Deshabilitar asientos: OFF";
    aisleButton.classList.remove("active");
    document.getElementById("eraserButton").classList.remove("active");
  }

  offsetButton.classList.toggle("active", isOffsetMode);
  offsetButton.textContent = `↔️ Modo Offset: ${isOffsetMode ? "ON" : "OFF"}`;
});

//
function addSeatType(e) {
  e.preventDefault();
  const name = document.getElementById("typeName").value.trim();
  const price = document.getElementById("typePrice").value;
  if (!name || seatTypes[name]) return;

  // seatTypes[name] = selectedColor;
  seatTypes[name] = { color: selectedColor, price: price };
  updateLegend();
  updateTypeSelector();
  document.getElementById("typeForm").reset();
}

//Actualizar leyendas
function updateLegend() {
  var legend = document.getElementById("legend");
  legend.innerHTML = "";

  for (var name in seatTypes) {
    if (seatTypes.hasOwnProperty(name)) {
      var color = seatTypes[name].color;

      var chip = document.createElement("div");
      chip.className = "chip";

      var colorCircle = document.createElement("span");
      colorCircle.className = "chip-color";
      colorCircle.style.backgroundColor = color;

      var label = document.createElement("span");
      label.className = "chip-name";
      label.textContent = name;

      var removeBtn = document.createElement("button");
      removeBtn.className = "chip-remove";
      removeBtn.innerHTML = "❌";
      removeBtn.title = "Eliminar tipo";
      removeBtn.onclick = (function (typeName) {
        return function () {
          removeSeatType(typeName);
        };
      })(name);

      chip.appendChild(colorCircle);
      chip.appendChild(label);
      chip.appendChild(removeBtn);
      legend.appendChild(chip);
    }
  }
}

function removeSeatType(name) {
  delete seatTypes[name];

  // Si usas un <select> o botones para tipos, actualízalos también
  if (typeof updateTypeSelector === "function") {
    updateTypeSelector();
  }

  // Eliminar el tipo de todos los asientos que lo usaban
  var seats = document.querySelectorAll(".seat");
  for (var i = 0; i < seats.length; i++) {
    if (seats[i].dataset.type === name) {
      seats[i].dataset.type = "";
      seats[i].style.backgroundColor = "";
    }
  }

  updateLegend();
}

function updateTypeSelector() {
  const select = document.getElementById("seatTypeSelect");
  const nameInput = document.getElementById("typeName");
  const priceInput = document.getElementById("typePrice");
  select.innerHTML = "";
  for (let name in seatTypes) {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    select.appendChild(option);
  }

  select.onchange = () => {
    activeType = select.value;
    // Mostrar info del tipo seleccionado
    if (seatTypes[activeType]) {
      nameInput.value = activeType;
      priceInput.value = seatTypes[activeType].price || "";
      // Si quieres mostrar el color también:
      if (typeof pickr !== "undefined" && seatTypes[activeType].color) {
        pickr.setColor(seatTypes[activeType].color);
      }
    }
  };

  if (select.options.length === 1) {
    select.selectedIndex = 0;
    activeType = select.value;
    // Mostrar info del tipo seleccionado
    nameInput.value = activeType;
    priceInput.value = seatTypes[activeType].price || "";
    if (typeof pickr !== "undefined" && seatTypes[activeType].color) {
      pickr.setColor(seatTypes[activeType].color);
    }
  }
}

function selectSeatTypeFromImport() {
  const select = document.getElementById("seatTypeSelect");
  if (select.options.length > 0) {
    select.selectedIndex = 0;
    activeType = select.value;
  }
}

//EXPORT JSON
function exportJSON() {
  const rows = parseInt(document.getElementById("rows").value);
  const cols = parseInt(document.getElementById("cols").value);
  // const selectedColor = document.getElementById('selectedColor').value;
  const seatElements = document.querySelectorAll(".seat");
  const seats = [];

  seatElements.forEach((seat) => {
    const type = seat.dataset.type;
    if (type) {
      seats.push({
        row: parseInt(seat.dataset.row),
        col: parseInt(seat.dataset.col),
        type: type,
      });
    }
  });

  const output = {
    rows,
    cols,
    selectedColor: selectedColorAsiento,
    types: seatTypes,
    seats,
  };

  document.getElementById("jsonOutput").value = JSON.stringify(output, null, 2);
}

//COPIAR JSON
function copyJSON() {
  const jsonText = document.getElementById("jsonOutput").value;
  navigator.clipboard
    .writeText(jsonText)
    .then(() => {
      const btn = document.querySelector(".copy-btn");
      const original = btn.innerHTML;
      btn.innerHTML = "✅ Copiado";
      btn.disabled = true;

      setTimeout(() => {
        btn.innerHTML = original;
        btn.disabled = false;
      }, 1500);
    })
    .catch((err) => {
      console.error("Error al copiar:", err);
    });
}

//IMPORT JSON
document.getElementById("importJsonBtn").addEventListener("click", () => {
  const rawText = document.getElementById("jsonOutput").value;
  let parsed;

  try {
    parsed = JSON.parse(rawText);
  } catch (e) {
    alert("❌ JSON inválido. Por favor revisa el formato.");
    return;
  }

  importFromJSON(parsed);
  // alert("✅ Mapa importado con éxito.");
});

function importFromJSON(data) {
  // 1. Cargar filas y columnas
  document.getElementById("rows").value = data.rows;
  document.getElementById("cols").value = data.cols;
  // document.getElementById('selectedColor').value = data.selectedColor;

  // 2. Reconstruir tipos de asiento
  Object.keys(seatTypes).forEach((type) => delete seatTypes[type]); // Limpiar anteriores
  Object.assign(seatTypes, data.types || {});
  updateLegend();
  updateTypeSelector();
  selectSeatTypeFromImport();

  // 2.5. Aplicar color de selección si existe
  if (data.selectedColor) {
    pickrSelected.setColor(data.selectedColor); // sincroniza el picker visual
  }

  // 3. Generar el grid
  generateGrid();

  // 4. Aplicar los tipos a los asientos
  const seatElements = document.querySelectorAll(".seat");
  data.seats.forEach((seat) => {
    const selector = `.seat[data-row="${seat.row}"][data-col="${seat.col}"]`;
    const seatEl = document.querySelector(selector);
    if (!seatEl) return;

    if (seat.type === "disabled") {
      seatEl.classList.add("disabled", "aisle");
      seatEl.dataset.type = "disabled";
      seatEl.dataset.isAisle = "true";
      seatEl.style.backgroundColor = "#ccc";
    } else if (seat.type === "offset") {
      seatEl.classList.add("offset");
      seatEl.dataset.type = "offset";
      seatEl.dataset.isAisle = "false";
      seatEl.style.backgroundColor = "#ccc";
    } else if (seatTypes[seat.type]) {
      seatEl.dataset.type = seat.type;
      seatEl.dataset.isAisle = "false";
      seatEl.classList.remove("disabled", "aisle");
      seatEl.style.backgroundColor = seatTypes[seat.type].color;
    }
  });
}

// PLANTILLAS
document.getElementById("plantilla").addEventListener("change", async (e) => {
  const type = e.target.value;
  if (!type) return;

  // Ruta al archivo JSON de la plantilla
  const url = `../../assets/${type}.json`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("No se pudo cargar la plantilla");
    const plantilla = await response.json();
    importFromJSON(plantilla); // Usa tu función existente para importar el mapa
    exportJSON();
  } catch (err) {
    alert("Error al cargar la plantilla: " + err.message);
  }
});

// MENU DE OPCIONES PARA AGREGAR FILAS O COLUMNAS CON CLICK DERECHO
function showContextMenu(e, row, col) {
  // Elimina menú anterior si existe
  const oldMenu = document.getElementById("seatContextMenu");
  if (oldMenu) oldMenu.remove();

  const menu = document.createElement("div");
  menu.id = "seatContextMenu";
  menu.style.position = "absolute";
  menu.style.top = `${e.pageY + 20}px`;
  menu.style.left = `${e.pageX + 20}px`;
  menu.style.background = "#fff";
  menu.style.border = "1px solid #ccc";
  menu.style.zIndex = 1000;
  menu.style.boxShadow = "0 2px 8px rgba(0,0,0,0.15)";
  menu.style.padding = "4px";

  [
    { label: "Insertar fila arriba", action: () => insertRowAt(row) },
    { label: "Insertar fila abajo", action: () => insertRowAt(row + 1) },
    {
      label: "Insertar columna a la izquierda",
      action: () => insertColAt(col),
    },
    {
      label: "Insertar columna a la derecha",
      action: () => insertColAt(col + 1),
    },
  ].forEach((item) => {
    const btn = document.createElement("button");
    btn.textContent = item.label;
    btn.style.display = "block";
    btn.style.width = "100%";
    btn.onclick = () => {
      item.action();
      menu.remove();
    };
    menu.appendChild(btn);
  });

  document.body.appendChild(menu);

  // Cierra el menú si haces click fuera
  document.addEventListener("click", function handler() {
    menu.remove();
    document.removeEventListener("click", handler);
  });
}

generateGrid();
