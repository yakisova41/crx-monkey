let count = 0;
const counter = document.querySelector('.counter')!;
document.querySelector('.count-up')!.addEventListener('click', () => {
  count++;
  counter.textContent = count.toString();
});
