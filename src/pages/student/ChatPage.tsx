import { StudentChat } from "@/components/StudentChat";

const ChatPage = () => {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Student Assistant</h1>
        <p className="text-muted-foreground">
          Get instant answers to your questions about attendance, courses, and academic policies.
        </p>
      </div>
      <StudentChat />
    </div>
  );
};

export default ChatPage;
