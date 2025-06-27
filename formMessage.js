const params = new URLSearchParams(window.location.search);
const status = params.get("status");

const messageBox = document.getElementById("message-box");

if (status === "success") {
  messageBox.innerHTML = `
    
      <h2 class="success">Message Sent Successfully!</h2>
      <p>Thank you for reaching out.</p>
      <a href="contact.html" class="back-btn">Back</a>
    
    `;
} else {
  messageBox.innerHTML = `
        <h2 class="error">Message Failed</h2>
        <p>Sorry, something went wrong. Please try again later.</p>
        <a href="contact.html" class="back-btn">Try Again</a>
      `;
}
