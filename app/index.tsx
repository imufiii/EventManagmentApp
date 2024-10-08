import React, { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { StatusBar } from "expo-status-bar";
import { Alert, TouchableOpacity, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AUTH } from "../firebaseConfig";
import {
  loadTasks,
  addTask,
  updateTask,
  removeTask,
  TaskProps,
} from "../components/databse";
import Header from "../components/Header";
import HomePage from "../components/Home"; // Update this import
import Tasks from "../components/Events";
import Form from "../components/AddEvents";
import Login from "../components/Login";
import Signup from "../components/Signup";
import About from "../components/About";
import ContactForm from "../components/ContactForm"; // Import ContactForm component

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const HomeTabs: React.FC<{
  tasks: TaskProps[];
  handleStatusChange: (id: string) => void;
  handleTaskRemoval: (id: string) => void;
  handleAddTask: (
    taskDescription: string,
    taskDate: string,
    taskTime: string
  ) => void;
}> = ({ tasks, handleStatusChange, handleTaskRemoval, handleAddTask }) => (
  <>
    <Header />
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: "#7D236C",
        tabBarInactiveTintColor: "#8e8e8e",
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "bold",
        },
        tabBarStyle: {
          backgroundColor: "#f8f8f8",
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomePage} // Update this to HomePage
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Events"
        children={() => (
          <Tasks
            tasks={tasks}
            onStatusChange={handleStatusChange}
            onTaskRemoval={handleTaskRemoval}
          />
        )}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Form"
        children={() => <Form onAddTask={handleAddTask} />}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="add-circle-outline" size={size} color={color} />
          ),
          headerShown: false,
        }}
      />
    </Tab.Navigator>
  </>
);

const App: React.FC = () => {
  const [tasks, setTasks] = useState<TaskProps[]>([]);
  const [user, setUser] = useState<any>(null);

  const handleAddTask = async (
    taskDescription: string,
    taskDate: string,
    taskTime: string
  ) => {
    const newTask: Omit<TaskProps, "id"> = {
      description: taskDescription,
      done: false,
      date: taskDate,
      time: taskTime,
    };

    if (user) {
      try {
        const docRef = await addTask(user.uid, newTask);
        const newTaskWithId = { id: docRef.id, ...newTask };
        setTasks([...tasks, newTaskWithId]);
      } catch (error) {
        Alert.alert("Ooops", "Failed to add Event. Please try again.");
      }
    }
  };

  const handleStatusChange = async (id: string) => {
    const updatedTasks = tasks.map((task) => {
      if (task.id === id) {
        task.done = !task.done;
      }
      return task;
    });

    setTasks(updatedTasks);

    const updatedTask = updatedTasks.find((task) => task.id === id);
    if (updatedTask && user) {
      try {
        await updateTask(user.uid, updatedTask);
      } catch (error) {
        Alert.alert(
          "Ooops",
          "Failed to update Event status. Please try again."
        );
      }
    }
  };

  const handleTaskRemoval = async (id: string) => {
    if (user) {
      try {
        await removeTask(user.uid, id);
        setTasks(tasks.filter((task) => task.id !== id));
      } catch (error) {
        Alert.alert("Ooops", "Failed to remove Event. Please try again.");
      }
    }
  };

  useEffect(() => {
    const fetchTasks = async () => {
      if (user) {
        try {
          const loadedTasks = await loadTasks(user.uid);
          setTasks(loadedTasks);
        } catch (error) {
          Alert.alert("Ooops", "Failed to load Events. Please try again.");
        }
      }
    };

    fetchTasks();

    const unsubscribe = AUTH.onAuthStateChanged((user) => {
      setUser(user);
    });

    return unsubscribe;
  }, [user]);

  return (
    <NavigationContainer independent={true}>
      <StatusBar style="auto" />
      <Stack.Navigator>
        {user ? (
          <>
            <Stack.Screen name="HomeTabs" options={{ headerShown: false }}>
              {(props) => (
                <HomeTabs
                  {...props}
                  tasks={tasks}
                  handleStatusChange={handleStatusChange}
                  handleTaskRemoval={handleTaskRemoval}
                  handleAddTask={handleAddTask}
                />
              )}
            </Stack.Screen>
            <Stack.Screen
              name="About"
              component={About}
              options={({ navigation }) => ({
                headerShown: true,
                headerLeft: () => (
                  <TouchableOpacity
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      padding: 10,
                    }}
                    onPress={() => navigation.goBack()}
                  >
                    <Ionicons name="arrow-back" size={24} color="#007BFF" />
                    <Text
                      style={{ marginLeft: 5, fontSize: 16, color: "#007BFF" }}
                    >
                      Back
                    </Text>
                  </TouchableOpacity>
                ),
              })}
            />
            <Stack.Screen
              name="ContactForm"
              component={ContactForm}
              options={{ title: "Contact Us" }}
            />
          </>
        ) : (
          <>
            <Stack.Screen
              name="Login"
              component={Login}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Signup"
              component={Signup}
              options={{ headerShown: false }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
