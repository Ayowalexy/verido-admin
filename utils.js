const DateFormatter = (data_three) => {
    let currentDay;
    const val = data_three.filter(data => {
        let dateJoined = new Date(data.dateJoined).toDateString();
        let dateJoinedMonth = dateJoined.slice(4, 7)
        let dateJoinedYear = dateJoined.slice(11);
        let dateJoinedDate = dateJoined.slice(8, 10)
        let dayJoined = dateJoined.slice(0, 3)

        switch(dayJoined){
            case 'Sun':
                currentDay = `${Number(dateJoinedDate)}`;
                break;
            case 'Mon':
                currentDay = `0${Number(dateJoinedDate) - 1}`
                break;
            case 'Tue':
                currentDay = `0${Number(dateJoinedDate) - 2}`
                break;
            case 'Wed':
                currentDay = `0${Number(dateJoinedDate) - 3}`
                break;
            case 'Thur':
                currentDay = `0${Number(dateJoinedDate) - 4}`
                break;
            case 'Fri':
                currentDay = `0${Number(dateJoinedDate) - 5}`
                break;
            case 'Sat':
                currentDay = `0${Number(dateJoinedDate) - 6}`
                break;
            default: 
                currentDay = 01
            
        }



        // let newDate = new Date(`Sun ${dateJoinedMonth} ${currentDay} ${dateJoinedYear}`)

        let d_1 = new Date(data.dateJoined).getTime()
        // let d_2 = newDate.getTime();

        let newDate = new Date()
        let d_2 = newDate.getDate() - newDate.getDay()
        let d_3 = new Date(newDate.setDate(d_2)).getTime()


       
        if(data.type === 'Subscribed' && d_3 < d_1){
            return data
        } else if(d_3 < d_1 && data.type === undefined){
            return data
        } else {
            return null
        }

        


    })

    console.log(val.length)
    return val
}

module.exports = DateFormatter