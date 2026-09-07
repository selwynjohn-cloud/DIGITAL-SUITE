document.getElementById("year").textContent = String(new Date().getFullYear());

const form = document.querySelector(".form");
if (form) {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const place = (form.place?.value || "").trim();
    const message = form.message.value.trim();
    const subject = encodeURIComponent(`Visitor Desk — ${name}`);
    const body = encodeURIComponent(
      `${message}\n\nPlace: ${place || "—"}\n— ${name}\n${email}`
    );
    window.location.href = `mailto:selwyn.john@gmail.com?subject=${subject}&body=${body}`;
  });
}
