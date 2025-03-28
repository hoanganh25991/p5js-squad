function startGame() {
  window.setState({gamePaused: false});
  document.querySelector(".start-button").style.display = "none"; // Hide the start button after clicking
}
