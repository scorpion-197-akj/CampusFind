const STORAGE_KEY = "campusFindReportsV1";

const sampleReports = [
  {id:"sample-1",type:"Found",itemName:"Blue water bottle",category:"Water Bottles",itemDate:todayISO(),location:"Central Library",description:"Blue reusable bottle left near the reading tables.",contactName:"Campus Help Desk",contact:"Please visit the campus help desk.",createdAt:Date.now()-1000, sample:true},
  {id:"sample-2",type:"Lost",itemName:"Student notebook",category:"Books & Notes",itemDate:todayISO(),location:"Block C, Room 204",description:"A ruled notebook with class notes. Has a green cover.",contactName:"Student",contact:"Use the contact detail provided by the reporter.",createdAt:Date.now()-2000, sample:true},
  {id:"sample-3",type:"Found",itemName:"Set of keys",category:"Keys",itemDate:todayISO(),location:"Cafeteria entrance",description:"A small key ring found near the cafeteria entrance.",contactName:"Campus Help Desk",contact:"Please visit the campus help desk.",createdAt:Date.now()-3000, sample:true},
  {id:"sample-4",type:"Lost",itemName:"College ID card",category:"ID Card",itemDate:todayISO(),location:"Main academic block",description:"College ID card may have been misplaced between classes.",contactName:"Student",contact:"Use the contact detail provided by the reporter.",createdAt:Date.now()-4000, sample:true},
  {id:"sample-5",type:"Found",itemName:"Black pencil pouch",category:"Other",itemDate:todayISO(),location:"Computer lab",description:"Black zip pouch found on a desk after class.",contactName:"Campus Help Desk",contact:"Please visit the campus help desk.",createdAt:Date.now()-5000, sample:true},
  {id:"sample-6",type:"Lost",itemName:"Grey backpack",category:"Bags",itemDate:todayISO(),location:"Sports ground",description:"Grey backpack with books inside. Please contact if seen.",contactName:"Student",contact:"Use the contact detail provided by the reporter.",createdAt:Date.now()-6000, sample:true}
];
const itemIcons = {"Electronics":"🎧","ID Card":"🪪","Books & Notes":"📚","Bags":"🎒","Keys":"🔑","Water Bottles":"🧴","Other":"📦"};
const itemsGrid = document.getElementById("itemsGrid");
const emptyState = document.getElementById("emptyState");
const reportForm = document.getElementById("reportForm");
const formMessage = document.getElementById("formMessage");
let toastTimeout;

function todayISO() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}
document.querySelector('input[name="itemDate"]').max = todayISO();

function loadReports() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(saved) ? saved : [...sampleReports];
  } catch (error) {
    return [...sampleReports];
  }
}
function saveReports(reports) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
}
function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[char]));
}
function prettyDate(value) {
  if (!value) return "Date not provided";
  const date = new Date(value + "T00:00:00");
  return Number.isNaN(date.getTime()) ? "Date not provided" : date.toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"});
}
function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove("show"), 3200);
}
function renderReports() {
  const reports = loadReports();
  const search = document.getElementById("searchInput").value.trim().toLowerCase();
  const category = document.getElementById("categoryFilter").value;
  const type = document.getElementById("typeFilter").value;
  const filtered = reports.filter(item => {
    const text = [item.itemName,item.category,item.location,item.description].join(" ").toLowerCase();
    return (!search || text.includes(search)) &&
      (category === "all" || item.category === category) &&
      (type === "all" || item.type === type);
  }).sort((a,b) => (b.createdAt || 0) - (a.createdAt || 0));

  document.getElementById("totalCount").textContent = reports.length;
  document.getElementById("foundCount").textContent = reports.filter(item => item.type === "Found").length;
  document.getElementById("resultsLabel").textContent = `${filtered.length} ${filtered.length === 1 ? "report" : "reports"} shown`;

  itemsGrid.innerHTML = filtered.map((item,index) => {
    const icon = itemIcons[item.category] || "📦";
    const safeType = item.type === "Found" ? "found" : "lost";
    return `<article class="item-card">
      <div class="item-visual tone-${index % 6}">
        <span class="item-type ${safeType}">${escapeHTML(item.type.toUpperCase())}</span>
        <span aria-hidden="true">${icon}</span>
      </div>
      <div class="item-body">
        <div class="item-meta"><span class="category-pill">${escapeHTML(item.category)}</span><span>${escapeHTML(prettyDate(item.itemDate))}</span></div>
        <h3>${escapeHTML(item.itemName)}</h3>
        <p class="item-description">${escapeHTML(item.description)}</p>
        <div class="item-footer"><span class="location" title="${escapeHTML(item.location)}">📍 ${escapeHTML(item.location)}</span>
          <button class="contact-button" data-report-id="${escapeHTML(item.id)}">View contact ↗</button>
        </div>
      </div>
    </article>`;
  }).join("");

  emptyState.classList.toggle("hidden", filtered.length !== 0);
  itemsGrid.classList.toggle("hidden", filtered.length === 0);
}
document.getElementById("searchInput").addEventListener("input", renderReports);
document.getElementById("categoryFilter").addEventListener("change", renderReports);
document.getElementById("typeFilter").addEventListener("change", renderReports);

itemsGrid.addEventListener("click", event => {
  const button = event.target.closest("[data-report-id]");
  if (!button) return;
  const item = loadReports().find(report => report.id === button.dataset.reportId);
  if (!item) return;
  alert(`Reported by: ${item.contactName}\nContact: ${item.contact}\n\nPlease be respectful and verify ownership before handing over an item.`);
});

reportForm.addEventListener("change", event => {
  if (event.target.name === "reportType") {
    document.querySelectorAll(".type-option").forEach(option => option.classList.toggle("selected", option.contains(event.target)));
  }
});

reportForm.addEventListener("submit", event => {
  event.preventDefault();
  if (!reportForm.reportValidity()) return;
  const data = new FormData(reportForm);
  const item = {
    id: (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : `report-${Date.now()}`,
    type: data.get("reportType"),
    itemName: String(data.get("itemName")).trim(),
    category: data.get("category"),
    itemDate: data.get("itemDate"),
    location: String(data.get("location")).trim(),
    description: String(data.get("description")).trim(),
    contactName: String(data.get("contactName")).trim(),
    contact: String(data.get("contact")).trim(),
    createdAt: Date.now()
  };
  const reports = loadReports();
  reports.unshift(item);
  try {
    saveReports(reports);
    renderReports();
    reportForm.reset();
    document.querySelectorAll(".type-option").forEach((option,index) => option.classList.toggle("selected", index === 0));
    document.querySelector('input[name="itemDate"]').max = todayISO();
    formMessage.textContent = "Your report has been saved in this browser.";
    showToast("Report submitted successfully!");
    document.getElementById("browse").scrollIntoView({behavior:"smooth"});
  } catch (error) {
    formMessage.textContent = "Could not save the report. Your browser storage may be full or disabled.";
    showToast("Unable to save report in this browser.");
  }
});

document.getElementById("menuToggle").addEventListener("click", () => {
  document.getElementById("mainNav").classList.toggle("open");
});
document.querySelectorAll("#mainNav a").forEach(link => link.addEventListener("click", () => {
  document.getElementById("mainNav").classList.remove("open");
}));

// Start with example reports for the presentation/demo.
renderReports();
