Dynamic Scheduler

### clone the project.

```bash
npm i
```

### run the project

```bash
npm run dev
```

Note: npm run dev run the project as well as the json-server concurrently on port 3000. keep the port 3000 free or change the port in the package.json file.

### 1. Data Schema Design

### Course DTO

```bash
{
id: string;
name: string;
total_students: number | null;
total_sections: number | null;
total_periods: number | null;
periods_per_cycle: number | null;
students_per_section: number | null;
group: CourseGroup; //enum
}

CourseGroup
{
C6 = "C6",
C7 = "C7",
C8 = "C8",
C9 = "C9",
C10 = "C10",
HL1 = "HL1",
HL2 = "HL2",
Other = "Other",
}
```

### Teacher DTO

```bash
{
id: string;
name: string;
division: Division; //enum
otherRoles: string[];
maxLoad: number;
courses: Array<Course & { periods: number }>;
cpts: number; //could not find a way to calculate this, so assuming this will come from the backend
 }

Division
{
  MS = "MS",
  HS = "HS",
}
```

- Teacher's name, division, Other role, max load are added while creating a teacher record.
- Available periods, preps (number of distinct courses assigned to a teacher), are calculated in the frontend, courses are initially empty array, where assigned courses will be stored later on with the amount of periods.

#### assumptions that need clarification

- confused about cpts. assuming these are common planning time required by teachers which will be calculated by the backend. Based on the teachers roles, if he is eligible to take the course, he wont need cpt (+0), and if he is not eligible, then he might need cpt (+1).
- Disvision is either MS or HS, asumming MS teachers can't take HS courses but HS teachers can take MS courses.

### 2. Component Architecture

```
App
├─ public (for static files e.g json data)
├─ src
│ ├─ components
│ │ ├─ data-table
│ │ │ ├─ data-table.types.ts (types for data table component for SoC and maitainability)
│ │ │ └─ data-table.tsx (table component)
│ │ └─ scheduler-grid (main component)
│ ├─ types (shared DTOs, types and enums)
│ └─ utils (helper functions)
```

Implemented a sub component architecture for the data table component. To implement the 'S' of SOLID principle, seperating each component based on its responsibility all while keep the related component in the same file. Which make this architecture good for this scenario.

- scheduler-grid -> main central component where data fetching, filtering, memoizing, table configuring with columns done and passed down the child components as props. also contains collumn visibility controls for both table.
- DataTable -> layout, container, collapse functionality for the table.
- DataTable.Header -> headers + sorting
- DataTable.Body -> virtualization + row mapping
- DataTable.Row -> row rendering + drag and drop (without library)

### 3. State Management Plan

Kept it minimal, stored data in the main component which is passed down to the child components as props.
Of course using a state management library could have been a better option but I wanted to keep it simple.

### 4. Performance Strategy

- Fixed height for table (mandetory for virtualization)
- Only renders rows visible in the viewport + a few more rows (overscan 5).
- Given a minimum height for the row (estimateSize 33)
- specified measurement for element using the getBoundingClientRect method.

Also memoized columns, filtered data based on division and and the refetch function which gets called after drag and drop PUT update request.

### 5. Implementation Outline for Complex Features:

- Enabled drag and drop API for same course Id (same column), and data the are more than zero.
- On drag start, stored the data in drag event's dataTransfer on drop event,
  received the course id, as well as the source cell's data, which is needed for the course re assignment mock implementation. Of course, the implementation is not
  as it should be in real world since in the json-server, I only found i level of data alteration, can update nested patch/put update. and after drop the refetch function is called to update the data for the table. This could be done with tanstack query where after mutation, we could invalidate the query.
