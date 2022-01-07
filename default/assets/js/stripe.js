// const stripe = Stripe('pk_test_51JOpfuAASrRVh8zALxM4OdvV2MFKP9tZ3n3MoTDSLrMAepnUYXVl9D28qs9nJzDYIfDmp4KxeEhJYB6jeTcyBsuw00h9EBhpnb');
// const doc = document.querySelector('.ins')

// const res = [];

// (async () => {
//     const data = await axios.get('/stripe-customers')
//     const response = data.data.data;

//     if(response.length){
//         response.forEach(element => {
            
//             stripe.retrievePaymentIntent(element.client_secret).then(function(response) {
//                 if (response.paymentIntent && response.paymentIntent.status === 'succeeded') {
//                     res.push('Succeeded')
                    
//                 } else {
//                     res.push('Failed')
//                 }
//               });
//         });
//     }
    
//   const ul = document.createElement('ul')
//   ul.setAttribute('class', 'list-group custom-list-group mb-n3')
//   const li = document.createElement('li')
//   li.setAttribute('class', 'list-group-item align-items-center d-flex justify-content-between pt-0')
// //   li.appendChild(text)

//   res.forEach(element => {
//     ul.insertAdjacentHTML('afterbegin', `
//     <li class="list-group-item align-items-center d-flex justify-content-between">
//     <div class="media">
//         <img src="assets/images/small/atom.svg" height="30" class="me-3 align-self-center rounded" alt="...">
//         <div class="media-body align-self-center"> 
//             <h6 class="m-0">${element}</h6>
//             <p class="mb-0 text-muted">calendar.html</p>                                                                                           
//         </div><!--end media body-->
//     </div>
//     <div class="align-self-center">
//         <a href="" class="btn btn-sm btn-soft-primary">1.6k <i class="las la-external-link-alt font-15"></i></a>                                                                                               
//     </div>   
// </li>`)
        
     
//   })


//   doc.appendChild(ul)

//   })();


<% for( let index = 0; index < paymentIntents.length; index++ ) { %>
    <li class="list-group-item align-items-center d-flex justify-content-between">
             <div class="media">
                <i class="fas fa-check font-15" style="color: green;" ></i>                                                            
                 <div class="media-body align-self-center ps-2"> 
                     <h6 class="m-0">Amount Received: $<%=paymentIntents[index].amount %> </h6>
                     <p class="mb-0 text-muted">Payment Method: <%=paymentIntents[index].payment_method_types %> </p>                                                                                           
                 </div><!--end media body-->
             </div>
             <div class="align-self-center">
                 <a href="#" class="btn btn-sm btn-soft-primary"><%=paymentIntents[index].currency %> <i class="las la-external-link-alt font-15"></i></a>                                                                                               
             </div>   
         </li>
  <% } %>


