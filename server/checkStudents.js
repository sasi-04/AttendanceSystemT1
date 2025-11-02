import Datastore from 'nedb-promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

async function checkStudents() {
  const studentsDb = Datastore.create({ 
    filename: path.resolve(__dirname, 'data/students.db'), 
    autoload: true 
  })
  
  const allStudents = await studentsDb.find({})
  
  console.log(`\n📊 Total students: ${allStudents.length}\n`)
  
  // Group by department
  const byDept = {}
  allStudents.forEach(s => {
    const dept = s.department || 'No Department'
    if (!byDept[dept]) byDept[dept] = []
    byDept[dept].push(s)
  })
  
  console.log('Departments:')
  Object.entries(byDept).forEach(([dept, students]) => {
    console.log(`\n${dept}: ${students.length} students`)
    
    const byYear = {}
    students.forEach(s => {
      const year = s.year || 'No Year'
      byYear[year] = (byYear[year] || 0) + 1
    })
    
    Object.entries(byYear).forEach(([year, count]) => {
      console.log(`  ${year}: ${count}`)
    })
  })
  
  // Show first 3 students
  console.log('\n\nFirst 3 students:')
  allStudents.slice(0, 3).forEach(s => {
    console.log(`  ${s.studentId || s.regNo} - ${s.name} - Dept: ${s.department || 'none'} - Year: ${s.year || 'none'}`)
  })
}

checkStudents().catch(console.error)
