const formEL = document.getElementById("contact-form");

//function to handle form events
const formHandler = async function (e) {
  e.preventDefault();

  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const subject = document.getElementById("subject").value.trim();
  const message = document.getElementById("message").value.trim();

  try {
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, subject, message }),
    });
    const data = await res.json();

    if (res.ok) {
      window.location.href = "formMessage.html?status=success";
      e.target.reset();
    }
    if (!res.ok) {
      window.location.href = "formMessage.html?status=error";
    }
  } catch (error) {
    console.error("submission error:", error);
  }
};

//adding EVENTLISTENER to the form element
formEL.addEventListener("submit", formHandler);
