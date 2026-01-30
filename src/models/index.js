const User = require("./User");
const Subject = require("./Subject");
const Topic = require("./Topic");
const Subtopic = require("./Subtopic");
const StudyEntry = require("./StudyEntry");

// User -> Subject/Topic/Subtopic/StudyEntry
User.hasMany(Subject, { foreignKey: "user_id", as: "subjects" });
Subject.belongsTo(User, { foreignKey: "user_id", as: "user" });

User.hasMany(Topic, { foreignKey: "user_id", as: "topics" });
Topic.belongsTo(User, { foreignKey: "user_id", as: "user" });

User.hasMany(Subtopic, { foreignKey: "user_id", as: "subtopics" });
Subtopic.belongsTo(User, { foreignKey: "user_id", as: "user" });

User.hasMany(StudyEntry, { foreignKey: "user_id", as: "entries" });
StudyEntry.belongsTo(User, { foreignKey: "user_id", as: "user" });

// Subject -> Topic
Subject.hasMany(Topic, { foreignKey: "subject_id", as: "topics" });
Topic.belongsTo(Subject, { foreignKey: "subject_id", as: "subject" });

// Topic -> Subtopic
Topic.hasMany(Subtopic, { foreignKey: "topic_id", as: "subtopics" });
Subtopic.belongsTo(Topic, { foreignKey: "topic_id", as: "topic" });

// Entry -> Subject/Topic/Subtopic
StudyEntry.belongsTo(Subject, { foreignKey: "subject_id", as: "subject" });
StudyEntry.belongsTo(Topic, { foreignKey: "topic_id", as: "topic" });
StudyEntry.belongsTo(Subtopic, { foreignKey: "subtopic_id", as: "subtopic" });

module.exports = {
  User,
  Subject,
  Topic,
  Subtopic,
  StudyEntry
};
