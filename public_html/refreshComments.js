const createCommentsHTML = function(commentsData) {
  const commentsHTML = commentsData.map(({ date, name, comment }) => {
    return `<p>${date}: <strong>${name}</strong> : ${comment}</p>`;
  });
  return commentsHTML.reverse().join("\n");
};

const fetchComments = function(){
  fetch('/comments').then(function(response){
    return response.json();
  }).then(function(comments){
    document.getElementById('commentContainer').innerHTML=createCommentsHTML(comments);
  });
}