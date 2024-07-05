
// Convert a date to a string in the format of "YYYY/MM/DD"
export const dateToString = (date = new Date()) => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()

  const formattedMonth = month < 10 ? `0${month}` : month
  const formattedDay = day < 10 ? `0${day}` : day
  
  return `${year}/${formattedMonth}/${formattedDay}`
}

export default dateToString