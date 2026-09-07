import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { HomeScreen } from "./screens/HomeScreen";
import { CheckInScreen } from "./screens/CheckInScreen";
import { PassScreen } from "./screens/PassScreen";
import { TodayScreen } from "./screens/TodayScreen";
import { colors } from "./theme";

export type RootStackParamList = {
  Home: undefined;
  CheckIn: undefined;
  Today: undefined;
  Pass: { id: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.sand },
          headerTintColor: colors.ink,
          headerTitleStyle: { fontFamily: "Manrope_600SemiBold" },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.sand },
        }}
      >
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="CheckIn"
          component={CheckInScreen}
          options={{ title: "Check-in" }}
        />
        <Stack.Screen
          name="Today"
          component={TodayScreen}
          options={{ title: "Today" }}
        />
        <Stack.Screen
          name="Pass"
          component={PassScreen}
          options={{ title: "Gate pass" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
