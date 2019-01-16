const hide = function(){
  this.style.opacity = 0;
  setTimeout(()=> this.style.opacity=1,1000);
}

const initialize = function(){
  const water_can = document.getElementById('can');
  water_can.onclick = hide;
}

window.onload = initialize;