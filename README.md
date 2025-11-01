Dynamic Scheduler

Conclusion of the PDF:

- after column (24-25), the cells represent the teacher's periods assigned.

- ccw6 has 15 students per period and 2 periods per cycle.
  so he completes 6 periods if does the cycle 3 times (numOfCycle = periods / periodPerCycle).
  then to students = (numOfCycle \* studentPerPeriod)
  sum of all course student = # student column.

Columns:

- Teacher (fixed) - name of teacher
- division (fixed) - Assuming HS teacher can take MS course but MS teacher can't take HS course.
- Other role (fixed) - Assuming roles has to with what courses teacher can take.
- max load (fixed) - the total number of period a teacher can take.
- available period (calculated) - available slots for teacher to be assigned.
- Preps (calculated) - the number of distict courses of a teacher.
- Courses - dynamic list of courses.
- CPT - Assuming this fixed. since i dont see any other way to calculate this.

Course Assign:
Assuming there is a relation between role and course. A teacher only can be assigned courses based on his role / eligibility.
Since I dont have the clear idea of which courses can be taken by which teacher based on their role, I will not check for eligibility.
