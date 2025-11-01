Dynamic Scheduler

Conclusion of the PDF:

after column (24-25), the cells represent the teacher's period goal/assigned.



- ccw6 has 15 students per period and 2 periods per cycle.
so he completes 6 periods if does the cycle 3 times (numOfCycle = goal / periodPerCycle). 
then to get the total student count of that course for the teacher = (numOfCycle * studentPerPeriod) 
sum of all course student = # student column.

- division (fix) HS teacher can take MS course but MS teacher can't take HS course.
- Other role 
- max load (fix) is the total number of period a teacher can take.
- available period (calculate) is the number of period left available for the teacher to be assigned.


Course Assign: 
Assuming there is a relation between role and course. A teacher only can be assigned courses based on his role / eligibility.
Since I dont have the clear idea of which courses can be taken by which teacher based on their role, I will not check for eligibility.