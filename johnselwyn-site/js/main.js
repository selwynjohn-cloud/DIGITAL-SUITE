document.getElementById("year").textContent = String(new Date().getFullYear());

const form = document.querySelector(".contact-form");
if (form) {
  form.addEventListener("submit", (event) => {
    // Static hosting without a form backend: open mailto as a reliable fallback.
    if (!form.hasAttribute("data-netlify") || location.protocol === "file:") {
      event.preventDefault();
      const name = form.name.value.trim();
      const email = form.email.value.trim();
      const message = form.message.value.trim();
      const subject = encodeURIComponent(`Message from ${name}`);
      const body = encodeURIComponent(`${message}\n\n— ${name}\n${email}`);
      window.location.href = `mailto:selwyn.john@gmail.com?subject=${subject}&body=${body}`;
    }
  });
}
