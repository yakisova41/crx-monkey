const app = document.querySelector('#app')!;
app.innerHTML = `
<div class="container">
  <h1>CRX MONKEY 🐵🤚</h1>
  <p>Count: <span class="counter">0</span></p>
  <button class="count-up">Count</button>
</div>

<style>
  .container {
    width: 300px;
    height: 120px;
  }
</style>
`;

let count = 0;
const counter = document.querySelector('.counter')!;
document.querySelector('.count-up')!.addEventListener('click', () => {
  count++;
  counter.textContent = count.toString();
});
