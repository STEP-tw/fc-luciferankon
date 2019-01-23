const createCommentsHTML = function(commentsData) {
  const commentsHTML = commentsData.map(({ date, name, comment }) => {
    return `<p>${new Date(
      date
    ).toLocaleString()}: <strong>${name}</strong> : ${comment}</p>`;
  });
  return commentsHTML.reverse().join("\n");
};

const fetchComments = function() {
  fetch("/comments")
    .then(function(response) {
      return response.json();
    })
    .then(function(comments) {
      document.getElementById(
        "commentContainer"
      ).innerHTML = createCommentsHTML(comments);
    });
};

const validate = function() {
  const userName = document.getElementById("userName").value;
  fetch("/guest_book_home", { method: "POST", body: userName })
    .then(res => res.text())
    .then(page => {
      document.documentElement.innerHTML = page;
      fetchComments();
    });
};

window.onload = fetchComments;
