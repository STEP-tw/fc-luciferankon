const fetchComments = function(){
  fetch('/comments').then(function(response){
    return response.text();
  }).then(function(comments){
    document.getElementById('commentContainer').innerHTML=comments;
  });
}