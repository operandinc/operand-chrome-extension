import { operandClient, OperandService } from '@operandinc/sdk';
import * as React from 'react';
import { v4 as uuid } from 'uuid';
import { endpoint } from './environment';
import { getFirstName, getSetting } from './storage';

type Props = {
  className?: string;
  apiKey: string;
  parentId: string;
};

type Message = {
  sender: string;
  message: string;
  id: string;
  confidence: number;
};

const Chat: React.FC<Props> = (props) => {
  const [conversationId, setConversationId] = React.useState<
    string | undefined
  >(undefined);
  const init = React.useRef<boolean>(true);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [messages, setMessages] = React.useState<Array<Message>>([]);
  const [input, setInput] = React.useState<string>('');
  const [name, setName] = React.useState<string>('');

  React.useEffect(() => {
    async function onLoad() {
      const firstName = await getFirstName();
      if (firstName && firstName !== '') {
        setName(firstName);
      } else {
        setName('User');
      }

      if (init.current) {
        // Send default welcome message
        setMessages((messages) => [
          ...messages,
          {
            sender: 'Operand',
            message: 'Hello, how can I help you?',
            id: uuid(),
            confidence: 0,
          },
        ]);
        return;
      }
    }
    onLoad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function converse(message: string) {
    // Create a loading message
    const loadingMessageId = uuid();
    setMessages((messages) => [
      ...messages,
      {
        sender: 'Operand',
        message: '',
        id: loadingMessageId,
        confidence: 0,
      },
    ]);
    setLoading(true);

    const operandService = operandClient(
      OperandService,
      props.apiKey,
      endpoint
    );
    var resp;
    if (!conversationId) {
      resp = operandService.converse({
        options: {
          parentId: props.parentId,
        },
        input: message,
      });
    } else {
      resp = operandService.converse({
        conversationId: conversationId,
        input: message,
      });
    }

    for await (const message of resp) {
      if (message.conversationId && !conversationId) {
        setConversationId(message.conversationId);
      }
      if (loading) {
        setLoading(false);
      }
      if (message.messagePart) {
        // Incoming message
        //Message parts are single words, so we can just append them
        setMessages((messages) => {
          const newMessages = [...messages];
          const index = newMessages.findIndex((m) => m.id === loadingMessageId);
          if (index !== -1) {
            newMessages[index] = {
              sender: 'Operand',
              message: newMessages[index].message + message.messagePart,
              id: loadingMessageId,
              confidence: message.confidenceScore || 0,
            };
          }
          return newMessages;
        });
      }
      if (message.confidenceScore) {
        setMessages((messages) => {
          const newMessages = [...messages];
          const index = newMessages.findIndex((m) => m.id === loadingMessageId);
          if (index !== -1) {
            newMessages[index] = {
              sender: 'Operand',
              message: newMessages[index].message,
              id: loadingMessageId,
              confidence: message.confidenceScore || 0,
            };
          }
          return newMessages;
        });
      }
    }
  }

  return (
    <div className={props.className}>
      <div className="flex flex-col justify-end">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`chat ${
              message.sender === name ? 'chat-end' : 'chat-start'
            }`}
          >
            <div className="chat-header">{message.sender}</div>
            <div
              className={`chat-bubble text-sm
              ${message.sender === name ? 'chat-bubble-accent' : ''}
            `}
            >
              {message.message}
            </div>
            {message.confidence > 0 && (
              <div className="chat-footer">
                <div
                  className="tooltip tooltip-primary tooltip-right"
                  data-tip={
                    'Operand is ' +
                    (message.confidence * 100).toFixed(0) +
                    '% confident in this response, based on your files.'
                  }
                >
                  <span> {translateConfidence(message.confidence)} </span>
                </div>
              </div>
            )}
          </div>
        ))}
        <div className="flex items-center gap-4 mt-8 sticky bottom-0">
          <input
            className="input input-sm input-bordered w-full"
            value={input}
            autoFocus={true}
            autoComplete="off"
            onChange={(e) => setInput(e.target.value)}
            onKeyUp={async (e) => {
              if (e.key === 'Enter') {
                setMessages((messages) => [
                  ...messages,
                  {
                    sender: name,
                    message: input,
                    id: uuid(),
                    confidence: 0,
                  },
                ]);

                converse(input);
                setInput('');
              }
            }}
            placeholder="Type a message..."
          />
          <button className="btn btn-sm btn-primary">Send</button>
        </div>
      </div>
    </div>
  );
};

function translateConfidence(confidence: number) {
  if (confidence < 0.5) {
    return 'Tentatively confident';
  } else if (confidence < 0.7) {
    return 'Somewhat confident';
  } else if (confidence < 0.8) {
    return 'Confident';
  } else {
    return 'Very confident';
  }
}

export default Chat;
