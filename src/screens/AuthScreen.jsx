import React from "react";
import { Trophy } from "lucide-react";

const AuthScreen = ({
  username,
  setUsername,
  password,
  setPassword,
  isSignUp,
  setIsSignUp,
  usernameAvailable,
  setUsernameAvailable,
  checkingUsername,
  onAuth,
  onDebouncedUsernameCheck,
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-block bg-gradient-to-r from-emerald-500 to-teal-600 dark:from-emerald-600 dark:to-teal-700 text-white rounded-full p-4 mb-4">
            <Trophy size={40} />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent mb-2">
            Zikr Game
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Remember Allah, Earn Rewards
          </p>
        </div>

        <div className="space-y-4">
          {/* Username Input with Availability Check */}
          <div>
            <input
              type="text"
              placeholder="Username (e.g., Ahmed, Amir123)"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                // Check availability in real-time for signup
                if (isSignUp && e.target.value.length >= 3) {
                  onDebouncedUsernameCheck(e.target.value);
                } else {
                  setUsernameAvailable(null);
                }
              }}
              className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:border-emerald-500 dark:focus:border-emerald-400 focus:outline-none transition-colors"
            />
            {/* Username availability indicator */}
            {isSignUp && username.length >= 3 && (
              <p
                className={`text-xs mt-1 px-2 ${
                  checkingUsername
                    ? "text-gray-500"
                    : usernameAvailable === true
                      ? "text-green-600 dark:text-green-400"
                      : usernameAvailable === false
                        ? "text-red-600 dark:text-red-400"
                        : "text-gray-500"
                }`}
              >
                {checkingUsername
                  ? "⏳ Checking availability..."
                  : usernameAvailable === true
                    ? "✅ Username available!"
                    : usernameAvailable === false
                      ? `❌ Username "${username}" is already taken`
                      : "👤 Enter a unique username (case-sensitive)"}
              </p>
            )}
            {!isSignUp && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 px-2">
                👤 Usernames are case-sensitive
              </p>
            )}
          </div>

          {/* Password Input */}
          <div>
            <input
              type="password"
              placeholder="Password (min 6 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:border-emerald-500 dark:focus:border-emerald-400 focus:outline-none transition-colors"
            />
            {isSignUp && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 px-2">
                🔒 Password must be at least 6 characters
              </p>
            )}
          </div>

          {/* Login/Signup Button */}
          <button
            onClick={onAuth}
            disabled={isSignUp && usernameAvailable === false}
            className={`w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all ${
              isSignUp && usernameAvailable === false
                ? "opacity-50 cursor-not-allowed"
                : ""
            }`}
          >
            {isSignUp ? "Sign Up" : "Login"}
          </button>

          {/* Toggle between Login/Signup */}
          {!isSignUp ? (
            /* Login screen - Show prominent "First time user?" link */
            <div className="text-center space-y-2">
              <button
                onClick={() => {
                  setIsSignUp(true);
                  setUsername("");
                  setPassword("");
                  setUsernameAvailable(null);
                }}
                className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all"
              >
                🆕 First time user? Sign Up Here!
              </button>
            </div>
          ) : (
            /* Signup screen - Show "Already have account?" */
            <button
              onClick={() => {
                setIsSignUp(false);
                setUsername("");
                setPassword("");
                setUsernameAvailable(null);
              }}
              className="w-full text-emerald-600 dark:text-emerald-400 py-2 text-sm hover:underline"
            >
              Already have an account? Login
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;
