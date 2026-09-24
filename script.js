document.getElementById("year").textContent = new Date().getFullYear();

const form = document.getElementById("notify-form");
const message = document.getElementById("form-message");

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const email = document.getElementById("email").value.trim();
  if (!email) return;

  message.textContent = `Thanks! We'll email ${email} when we launch.`;
  form.reset();
});
