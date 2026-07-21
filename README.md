### CS572 Homework - MongoDB Aggregation

Given two MongoDB collections:
* `users`
* `courses`

The `courses` collection contains embedded documents using the following sub-schemas:
* `lectureSchema`
* `fileSchema`
* `questionSchema`

```typescript
import { type InferSchemaType, model, Schema } from "mongoose";

const userSchema = new Schema({
    fullname: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    location: { type: [Number], required: false },
    hobbies: { type: [String], required: false },
}, { versionKey: false });

const fileSchema = new Schema({
    originalname: { type: String, required: true },
    mimetype: { type: String, required: true },
    path: { type: String, required: true },
    size: { type: Number, required: true },
});

const questionSchema = new Schema({
    question: { type: String, required: true },
    due_date: { type: Number, default: () => Date.now() + 86400000 },
});

const lectureSchema = new Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    files: [fileSchema],
    questions: [questionSchema],
});

const courseSchema = new Schema({
    code: { type: String, required: true },
    title: { type: String, required: true },
    created_by: {
        user_id: Schema.Types.ObjectId,
        fullname: String,
        email: String,
    },
    lectures: [lectureSchema],
}, { versionKey: false });

export type User = InferSchemaType<typeof userSchema>;
export type Course = InferSchemaType<typeof courseSchema>;
export type Lecture = InferSchemaType<typeof lectureSchema>;
export type File = InferSchemaType<typeof fileSchema>;
export type Question = InferSchemaType<typeof questionSchema>;

export const UserModel = model<User>("user", userSchema);
export const CourseModel = model<Course>("course", courseSchema);
```    

Implement the following functions using Mongoose. Some operations must use MongoDB aggregation pipelines.

#### 1. Create a New User
Implement a function that creates a new user. Fill the `location` automatically with the following coordinates: `[-91.96731488465576, 41.018654231616374]`
```typescript
async function createUser(fullname: string, email: string, password: string): Promise<User>
```

#### 2. Create a New Course
Implement a function that creates a new course. The `created_by` field must be populated using the user object returned from `createUser()`.
```typescript
async function createCourse(code: string, title: string, user: User): Promise<Course>
```

#### 3. Add a New Lecture to a Course
Implement a function that adds a new lecture to an existing course.
```typescript
async function createLecture(courseId: string, title: string, description: string): Promise<Course | null>
```

#### 4. Add a New Question to a Lecture
Implement a function that adds a new question to a specific lecture.
```typescript
async function createQuestion(courseId: string, lectureId: string, question: string): Promise<Course | null>
```

#### 5. Find All Questions Using Aggregation
Implement a function that uses MongoDB aggregation pipeline to retrieve all questions for a specific lecture inside a specific course, with pagination.
```typescript
async function findQuestions(courseId: string, lectureId: string, page: number, limit: number): Promise<Question[]>
```

#### 6. Find One Question by ID Using Aggregation
Implement a function that uses MongoDB aggregation pipeline to retrieve a single question.
```typescript
async function findQuestionById(courseId: string, lectureId: string, questionId: string): Promise<Question | null>
```

#### 7. Update One Question Due Date
Implement a function that updates a single question and extend the `due_date` by one additional day.
```typescript
async function extendQuestionDueDate(courseId: string, lectureId: string, questionId: string): Promise<Course | null>
```

#### 8. Update All Questions Due Dates
Implement a function that updates all questions inside a lecture and extend every question's `due_date` by one additional day.
```typescript
async function extendAllQuestionsDueDate(courseId: string, lectureId: string): Promise<Course | null>
```

#### 9. Delete One Question
Implement a function that deletes a single question.
```typescript
async function deleteQuestion(courseId: string, lectureId: string, questionId: string): Promise<Course | null>
```

#### 10. Find Nearest Users by Hobbies
Implement a function that uses MongoDB `2d` index to find the nearest 10 users matching a given set of hobbies.
```typescript
async function findNearestUsers(location: number[], hobbies: string[]): Promise<User[]>
```
