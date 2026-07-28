import mongoose from "mongoose";
import { env } from "./env.mts";
import {
    type Course,
    CourseModel,
    type Question,
    type User,
    UserModel,
} from "./models.mts";
import { create } from "node:domain";

await mongoose.connect(env.DATABASE_URL);

async function createUser(
    fullname: string,
    email: string,
    password: string,
    location: number[] = [-91.96731488465576, 41.018654231616374],
    hobbies: string[] = [],
): Promise<User> {
    const user = await UserModel.create({
        fullname,
        email,
        password,
        location,
        hobbies,
    });
    return user;
}

// const results = await createUser(
//     "Asaad Saad",
//     "asaad@miu.edu",
//     "123456789",
//     [-91.96731488465576, 41.018654231616374],
//     ["teaching", "walking", "eating"],
// );
// console.log(results);
// 6a622ec79cb9247360bec6af

async function createCourse(
    code: string,
    title: string,
    user_id: string,
    fullname: string,
    email: string,
): Promise<Course> {
    const course = await CourseModel.create({
        code,
        title,
        created_by: {
            user_id,
            fullname,
            email,
        },
    });
    return course;
}
// const results = await createCourse(
//     "CS572",
//     "Modern Web Application",
//     "6a622ec79cb9247360bec6af",
//     "Asaad Saad",
//     "asaad@miu.edu",
// );
// console.log(results);
// 6a623021b4b5f3151495eadb

async function createLecture(
    courseId: string,
    title: string,
    description: string,
): Promise<string | null> {
    // generate new lecture ID
    const lecture_id = new mongoose.Types.ObjectId();
    const results = await CourseModel.updateOne(
        { _id: new mongoose.Types.ObjectId(courseId) },
        { $push: { lectures: { _id: lecture_id, title, description } } },
    );
    return (results.modifiedCount === 1) ? lecture_id.toString() : null;
}

async function createLectureV2(
    courseId: string,
    title: string,
    description: string,
): Promise<Course | null> {
    const course = await CourseModel.findByIdAndUpdate(
        new mongoose.Types.ObjectId(courseId),
        { $push: { lectures: { title, description } } },
        { returnDocument: "after" },
    );
    return course || null;
}

// const results = await createLectureV2(
//     "6a623021b4b5f3151495eadb",
//     "MongoDB Aggregation",
//     "Using the Aggregation Framework in MongoDB",
// );
// console.log(results);
// 6a62336d812f23430fc3b476
// 6a623562e54a614335c7333c

async function createQuestion(
    courseId: string,
    lectureId: string,
    question: string,
): Promise<string | null> {
    // generate new question ID
    const question_id = new mongoose.Types.ObjectId();
    const results = await CourseModel.updateOne(
        {
            _id: new mongoose.Types.ObjectId(courseId),
            "lectures._id": new mongoose.Types.ObjectId(lectureId),
        },
        { $push: { "lectures.$.questions": { _id: question_id, question } } },
    );
    return (results.modifiedCount === 1) ? question_id.toString() : null;
}

async function createQuestionV2(
    courseId: string,
    lectureId: string,
    question: string,
): Promise<string | null> {
    // generate new question ID
    const question_id = new mongoose.Types.ObjectId();
    const results = await CourseModel.updateOne(
        {
            _id: new mongoose.Types.ObjectId(courseId),
        },
        {
            $push: {
                "lectures.$[lecture].questions": { _id: question_id, question },
            },
        },
        {
            arrayFilters: [{
                "lecture._id": new mongoose.Types.ObjectId(lectureId),
            }],
        },
    );
    return (results.modifiedCount === 1) ? question_id.toString() : null;
}
// console.log(
//     await createQuestion(
//         "6a623021b4b5f3151495eadb",
//         "6a62336d812f23430fc3b476",
//         "How atomicity works?",
//     ),
// );
// console.log(
//     await createQuestion(
//         "6a623021b4b5f3151495eadb",
//         "6a62336d812f23430fc3b476",
//         "What are the main features on MongoDB?",
//     ),
// );
// console.log(
//     await createQuestion(
//         "6a623021b4b5f3151495eadb",
//         "6a62336d812f23430fc3b476",
//         "Can we create documents with various shcema in the same collection?",
//     ),
// );

// console.log(
//     await createQuestionV2(
//         "6a623021b4b5f3151495eadb",
//         "6a62336d812f23430fc3b476",
//         "How does MongoDB handle large updates?",
//     ),
// );
// 6a623768f2d5a1d44ea4fe69
// 6a623768f2d5a1d44ea4fe6b
// 6a623768f2d5a1d44ea4fe6d
// 6a623859ed88cd90bd2575b8

async function findQuestions(
    courseId: string,
    lectureId: string,
    page: number = 1,
    limit: number = 10,
): Promise<Question[]> {
    const results = await CourseModel.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(courseId) } },
        { $unwind: "$lectures" },
        { $match: { "lectures._id": new mongoose.Types.ObjectId(lectureId) } },
        { $unwind: "$lectures.questions" },
        {
            $project: {
                _id: 0,
                question: "$lectures.questions.question",
                question_id: "$lectures.questions._id",
                due_date: "$lectures.questions.due_date",
            },
        },
        { $skip: (page - 1) * limit },
        { $limit: limit },
    ]);
    return results;
}

// console.log(
//     await findQuestions(
//         "6a623021b4b5f3151495eadb",
//         "6a62336d812f23430fc3b476",
//     ),
// );

async function findQuestionById(
    courseId: string,
    lectureId: string,
    questionId: string,
): Promise<Question | null> {
    const results = await CourseModel.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(courseId) } },
        { $unwind: "$lectures" },
        { $match: { "lectures._id": new mongoose.Types.ObjectId(lectureId) } },
        { $unwind: "$lectures.questions" },
        {
            $match: {
                "lectures.questions._id": new mongoose.Types.ObjectId(
                    questionId,
                ),
            },
        },
        {
            $project: {
                _id: 0,
                question: "$lectures.questions.question",
                question_id: "$lectures.questions._id",
                due_date: "$lectures.questions.due_date",
            },
        },
    ]);
    return results[0] as Question | null;
}
// console.log(
//     await findQuestionById(
//         "6a623021b4b5f3151495eadb",
//         "6a62336d812f23430fc3b476",
//         "6a623768f2d5a1d44ea4fe6d",
//     ),
// );

async function extendQuestionDueDate(
    courseId: string,
    lectureId: string,
    questionId: string,
): Promise<Course | null> {
    // lectures[] => specific Lecture => questions [] => specific question.due_date
    const results = await CourseModel.findByIdAndUpdate(
        new mongoose.Types.ObjectId(courseId),
        {
            $inc: {
                "lectures.$[lecture].questions.$[question].due_date": 86400000,
            },
        },
        {
            arrayFilters: [
                { "lecture._id": new mongoose.Types.ObjectId(lectureId) },
                { "question._id": new mongoose.Types.ObjectId(questionId) },
            ],
        },
    );
    return results;
}
// console.log(
//     await extendQuestionDueDate(
//         "6a623021b4b5f3151495eadb",
//         "6a62336d812f23430fc3b476",
//         "6a623768f2d5a1d44ea4fe6d",
//     ),
//     "1785080808864",
//     "1785167208864",
// );

async function extendAllQuestionsDueDate(
    courseId: string,
    lectureId: string,
): Promise<Course | null> {
    const results = await CourseModel.findByIdAndUpdate(
        new mongoose.Types.ObjectId(courseId),
        {
            $inc: {
                "lectures.$[lecture].questions.$[].due_date": 86400000,
            },
        },
        {
            arrayFilters: [
                { "lecture._id": new mongoose.Types.ObjectId(lectureId) },
            ],
        },
    );
    return results;
}

async function deleteQuestion(
    courseId: string,
    lectureId: string,
    questionId: string,
): Promise<Course | null> {
    const results = await CourseModel.findByIdAndUpdate(
        new mongoose.Types.ObjectId(courseId),
        {
            $pull: {
                "lectures.$[lecture].questions": {
                    _id: new mongoose.Types.ObjectId(questionId),
                },
            },
        },
        {
            arrayFilters: [
                { "lecture._id": new mongoose.Types.ObjectId(lectureId) },
            ],
        },
    );
    return results;
}

async function deleteQuestionV2(
    courseId: string,
    lectureId: string,
    questionId: string,
): Promise<boolean> {
    const results = await CourseModel.updateOne(
        {
            _id: new mongoose.Types.ObjectId(courseId),
            "lecture._id": new mongoose.Types.ObjectId(lectureId),
        },
        {
            $pull: {
                "lectures.$.questions": {
                    _id: new mongoose.Types.ObjectId(questionId),
                },
            },
        },
    );
    return results.modifiedCount ? true : false;
}
// console.log(
//     await deleteQuestion(
//         "6a623021b4b5f3151495eadb",
//         "6a62336d812f23430fc3b476",
//         "6a623768f2d5a1d44ea4fe6d",
//     ),
// );

async function findNearestUsers(
    location: number[],
    hobbies: string[],
): Promise<User[]> {
    const results = await UserModel.find({
        location: { $near: location },
        hobbies: { $in: hobbies },
    }).limit(10);
    return results;
}

console.log(
    await findNearestUsers([-91.97230572572967, 40.99813110886304], [
        "walking",
    ]),
);
