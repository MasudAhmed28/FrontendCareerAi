import React, { useContext, useEffect, useState } from "react";
import { DataContext } from "./Contexts/DataContext";
import axios from "axios";
import { toast } from "react-toastify";
import MainHeader from "./MainHeader";
import MainFooter from "./MainFooter";
import LoadSpinner from "./LoadSpinner";
import { useNavigate, useParams } from "react-router-dom";

const Course = () => {
  const [courses, setCourses] = useState([]);
  const { roadmapData } = useContext(DataContext);
  const [topic, setTopic] = useState("");
  const { topicId } = useParams();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const normalizedTopicId = topicId?.toLowerCase();

    if (normalizedTopicId === "topic") {
      if (roadmapData?.name) {
        setTopic(roadmapData.name);
        fetchCoursesOnline(roadmapData.name);
      } else {
        setTopic("");
        setCourses([]);
      }
    } else if (normalizedTopicId === "ai") {
      setTopic("AI");
      fetchCoursesOnline("AI");
    } else {
      setTopic("");
      setCourses([]);
    }
  }, [roadmapData, topicId]);

  const fetchCoursesOnline = async (topic) => {
    if (!topic) return;
    setLoading(true);

    const isAICourse = topic.toLowerCase() === "ai";
    const cacheKey = isAICourse ? "AICourses" : "Courses";
    const cacheExpiryKey = `${cacheKey}-expiry`;

    try {
      const cachedData = localStorage.getItem(cacheKey);
      const cacheExpiration = localStorage.getItem(cacheExpiryKey);

      if (cachedData && Date.now() < cacheExpiration) {
        setCourses(JSON.parse(cachedData));
        return;
      }

      const response = await axios.get(
        `https://www.googleapis.com/customsearch/v1`,
        {
          params: {
            q: `free ${topic} courses`,
            key: process.env.REACT_APP_YOUTUBE_API_KEY,
            cx: process.env.REACT_APP_GOOGLE_CX,
          },
        }
      );

      const result = response.data?.items?.map((item) => ({
        title: item.title,
        link: item.link,
        snippet: item.snippet,
      }));

      localStorage.setItem(cacheKey, JSON.stringify(result));
      localStorage.setItem(cacheExpiryKey, Date.now() + 3600 * 1000);
      setCourses(result);
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Failed to fetch courses", {
        position: "top-center",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadSpinner text={"Loading Course"} />;
  }

  return (
    <>
      <MainHeader />
      <div className="p-5 pt-20 pb-30">
        <h2 className="text-center mb-8 font-semibold text-xl flex flex-col items-center">
          {topic ? (
            `Courses Related to ${topic}`
          ) : (
            <>
              <p>
                Please create a Roadmap first to get personalised course
                suggestions
              </p>

              <button
                onClick={() => navigate("/course/ai")}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 mt-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition duration-300 shadow-lg"
              >
                Browse Courses
              </button>
            </>
          )}
        </h2>

        {courses?.length > 0 ? (
          <div className="flex flex-wrap gap-5 justify-center">
            {courses.map((item, index) => (
              <div
                key={index}
                className="bg-white border border-gray-200 rounded-lg shadow-md p-4 max-w-xs w-full text-center transition-transform transform hover:scale-105 hover:shadow-lg"
              >
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="no-underline"
                >
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">
                    {item.title}
                  </h3>
                </a>
                <p className="text-sm text-gray-600">{item.snippet}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 text-base">
            {topic ? "No courses available for the selected topic" : ""}
          </p>
        )}
      </div>
      <MainFooter />
    </>
  );
};

export default Course;
