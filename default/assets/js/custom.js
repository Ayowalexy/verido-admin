const loader = document.querySelector('.loader-parent')
const main = document.querySelector('#page-content')
const form = document.querySelector('#form-anim')

form.onsubmit = function(event){
    loader.style.opacity = '1';
    main.style.filter = 'blur(3px)'
}