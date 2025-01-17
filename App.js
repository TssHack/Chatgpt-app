import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Alert, TouchableOpacity, ActivityIndicator, Text, Appearance } from 'react-native';
import { GiftedChat, Bubble, Send, Time, InputToolbar, Composer } from 'react-native-gifted-chat';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Ionicons';
import { Switch } from 'react-native-paper';
import axios from 'axios';
import * as Linking from 'expo-linking';

export default function App() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(Appearance.getColorScheme() === 'dark');

  useEffect(() => {
    retrieveMessages();
    retrieveMode();
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setIsDarkMode(colorScheme === 'dark');
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    storeMessages(messages);
    storeMode(isDarkMode);
  }, [messages, isDarkMode]);

  useEffect(() => {
    const showInitialDialog = async () => {
      try {
        const hasOpenedBefore = await AsyncStorage.getItem('hasOpenedBefore');
        if (hasOpenedBefore === null) {
          Alert.alert(
            'Rate the app',
            'Please rate the app to support us. Also report bugs and issues easily.',
            [
              {
                text: 'Rate app',
                onPress: () => Linking.openURL('https://myket.ir/app/ir.chatgpt.ehsan'),
              },
              {
                text: 'Cancel',
                onPress: () => { },
                style: 'cancel',
              },
            ],
            { cancelable: false }
          );
          await AsyncStorage.setItem('hasOpenedBefore', 'true');
        }
      } catch (error) {
        console.error('Failed to show initial dialog', error);
      }
    };

    showInitialDialog();
  }, []);

  const retrieveMessages = async () => {
    try {
      const storedMessages = await AsyncStorage.getItem('messages');
      if (storedMessages !== null) {
        setMessages(JSON.parse(storedMessages));
      }
    } catch (error) {
      console.error('Failed to retrieve messages', error);
    }
  };

  const storeMessages = async (messages) => {
    try {
      await AsyncStorage.setItem('messages', JSON.stringify(messages));
    } catch (error) {
      console.error('Failed to store messages', error);
    }
  };

  const retrieveMode = async () => {
    try {
      const storedMode = await AsyncStorage.getItem('mode');
      if (storedMode !== null) {
        setIsDarkMode(storedMode === 'dark');
      }
    } catch (error) {
      console.error('Failed to retrieve mode', error);
    }
  };

  const storeMode = async (mode) => {
    try {
      await AsyncStorage.setItem('mode', mode ? 'dark' : 'light');
    } catch (error) {
      console.error('Failed to store mode', error);
    }
  };

  const onSend = async (newMessages = []) => {
    if (newMessages[0].text.trim() === '') {
      Alert.alert('Error', 'Message cannot be empty');
      return;
    }

    setIsLoading(true);
    setMessages(previousMessages => GiftedChat.append(previousMessages, newMessages));

    const tempMessage = {
      _id: Math.random().toString(36).substring(7),
      text: 'Message is sending...',
      createdAt: new Date().toISOString(),
      user: {
        _id: 2,
        name: 'ChatGPT',
        avatar: "https://chatbot-app.github.io/static/media/icon.2a8ba17c99b635094f6b.png",
      },
    };
    setMessages(previousMessages => GiftedChat.append(previousMessages, tempMessage));

    try {
      const response = await axios.get(`https://req.wiki-api.ir/apis-2/ChatGPT4?q=${encodeURIComponent(newMessages[0].text)}`);
      const data = response.data;
      const botResponse = {
        _id: tempMessage._id,
        text: data.results,
        createdAt: new Date().toISOString(),
        user: {
          _id: 2,
          name: 'ChatGPT',
          avatar: "https://chatbot-app.github.io/static/media/icon.2a8ba17c99b635094f6b.png",
        },
      };
      setIsLoading(false);
      setMessages(previousMessages => previousMessages.map(msg => msg._id === tempMessage._id ? botResponse : msg));
    } catch (error) {
      setIsLoading(false);
      Alert.alert('Error', error.message);
      const errorMessage = {
        _id: tempMessage._id,
        text: 'Failed to send message. Please try again.',
        createdAt: new Date().toISOString(),
        user: {
          _id: 2,
          name: 'ChatGPT',
          avatar: "https://chatbot-app.github.io/static/media/icon.2a8ba17c99b635094f6b.png",
        },
      };
      setMessages(previousMessages => previousMessages.map(msg => msg._id === tempMessage._id ? errorMessage : msg));
    }
  };

  const deleteChat = () => {
    Alert.alert(
      'Delete Chat',
      'Are you sure you want to delete this chat?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'OK',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('messages');
              setMessages([]);
            } catch (error) {
              console.error('Failed to delete chat', error);
            }
          },
        },
      ],
      { cancelable: false }
    );
  };

  const renderBubble = (props) => {
    return (
      <Bubble
        {...props}
        wrapperStyle={{
          right: {
            backgroundColor: isDarkMode ? '#3c3f42' : '#000',
          },
        }}
        textStyle={{
          right: {
            color: isDarkMode ? '#fff' : '#fff',
          },
        }}
        timeTextStyle={{
          right: {
            color: 'rgba(255,255,255,0.5)',
          },
        }}
      />
    );
  };

  const renderSend = (props) => {
    return (
      <Send {...props}>
        <View style={styles.sendingContainer}>
          <ActivityIndicator size="small" color="#007aff" />
        </View>
      </Send>
    );
  };

  const renderLoading = () => {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007aff" />
      </View>
    );
  };

  const renderTime = (props) => (
    <Time
      {...props}
      timeTextStyle={{
        left: {
          color: 'grey',
        },
        right: {
          color: 'grey',
        },
      }}
      format='HH:mm'
    />
  );

  const renderInputToolbar = (props) => (
    <InputToolbar
      {...props}
      containerStyle={{
        backgroundColor: isDarkMode ? '#41444a' : '#fff',
        borderTopColor: isDarkMode ? '#fff' : '#000',
        borderTopWidth: 1,
        minHeight: 50,
      }}
    />
  );

  const renderComposer = (props) => (
    <Composer
      {...props}
      textInputStyle={{
        color: isDarkMode ? '#fff' : '#000',
        backgroundColor: isDarkMode ? '#333' : '#f0f0f0',
        paddingTop: 12,
        paddingBottom: 12,
        paddingHorizontal: 12,
        marginLeft: 0,
      }}
    />
  );

  const toggleSwitch = () => setIsDarkMode(previousState => !previousState);

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? '#000' : '#fff' }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: isDarkMode ? '#fff' : '#000' }]}>Chat GPT</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Switch style={{ marginRight: 12 }} value={isDarkMode} onValueChange={toggleSwitch} />
          <TouchableOpacity onPress={deleteChat}>
            <Icon name="trash-outline" size={24} color={isDarkMode ? '#fff' : '#000'} />
          </TouchableOpacity>
        </View>
      </View>
      <GiftedChat
        messages={messages}
        onSend={newMessages => onSend(newMessages)}
        user={{
          _id: 1,
        }}
        renderBubble={renderBubble}
        renderSend={isLoading ? renderSend : null}
        renderLoading={renderLoading}
        renderTime={renderTime}
        renderInputToolbar={renderInputToolbar}
        renderComposer={renderComposer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
