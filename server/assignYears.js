import Datastore from 'nedb-promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

async function assignYears() {
  console.log('📚 Assigning years to students...\n')
  
  const studentsDb = Datastore.create({ 
    filename: path.resolve(__dirname, 'data/students.db'), 
    autoload: true 
  })
  
  // Get all students
  const allStudents = await studentsDb.find({})
  
  // Group students by department
  const byDepartment = {}
  allStudents.forEach(student => {
    const dept = student.department || 'M.Tech'
    if (!byDepartment[dept]) {
      byDepartment[dept] = []
    }
    byDepartment[dept].push(student)
  })
  
  console.log('📊 Students by department:')
  Object.keys(byDepartment).forEach(dept => {
    console.log(`   ${dept}: ${byDepartment[dept].length} students`)
  })
  console.log()
  
  // For each department, sort students by ID and assign years
  for (const [dept, students] of Object.entries(byDepartment)) {
    console.log(`\n🔄 Processing ${dept}...`)
    
    // Sort students by studentId or regNo in ascending order
    students.sort((a, b) => {
      const idA = a.studentId || a.regNo
      const idB = b.studentId || b.regNo
      return idA.localeCompare(idB, undefined, { numeric: true })
    })
    
    // Distribute students evenly across 4 years
    const totalStudents = students.length
    const studentsPerYear = Math.ceil(totalStudents / 4)
    
    const years = ['1st Year', '2nd Year', '3rd Year', '4th Year']
    
    for (let i = 0; i < students.length; i++) {
      const student = students[i]
      const yearIndex = Math.min(Math.floor(i / studentsPerYear), 3) // Ensure max index is 3
      const year = years[yearIndex]
      
      // Skip if student already has the correct year assigned
      if (student.year === year) {
        continue
      }
      
      // Update student with year
      await studentsDb.update(
        { regNo: student.regNo },
        { $set: { year } }
      )
      
      console.log(`   ✓ ${student.studentId || student.regNo} (${student.name}) → ${year}`)
    }
    
    // Show distribution
    console.log(`\n   Distribution in ${dept}:`)
    const distribution = {}
    students.forEach((s, i) => {
      const yearIndex = Math.min(Math.floor(i / studentsPerYear), 3)
      const year = years[yearIndex]
      distribution[year] = (distribution[year] || 0) + 1
    })
    
    years.forEach(year => {
      console.log(`      ${year}: ${distribution[year] || 0} students`)
    })
  }
  
  console.log('\n✅ Year assignment completed!')
}

assignYears().catch(err => {
  console.error('❌ Error:', err)
  process.exit(1)
})
