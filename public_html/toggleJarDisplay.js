const hide = function(){
  const target = event.target;
  target.style.visibility = 'hidden';
  setTimeout(()=> target.style.visibility='visible',1000);
}

const initialize = function(){
  const water_can = document.getElementById('can');
  water_can.onclick = hide;
}

window.onload = initialize;